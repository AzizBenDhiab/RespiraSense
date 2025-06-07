import { Audio, AVPlaybackStatus } from "expo-av";
import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// Add these imports at the top of VoiceRecorder.tsx
import { useNavigation } from "@react-navigation/native";
import { useChat } from "../context/ChatContext"; // Adjust path as needed
// Types pour le statut d'enregistrement
interface RecordingStatus {
  canRecord?: boolean;
  isRecording?: boolean;
  durationMillis?: number;
}

// Types pour la réponse de l'API Flask - FIXED to match Flask API response
interface FlaskApiResponse {
  success?: boolean;
  error?: string;
  audio_file?: string;
  predicted_disease?: string; // Changed from predicted_class
  confidence?: number;
  confidence_percent?: string;
  confidence_level?: string; // Added
  is_reliable?: boolean; // Changed from is_confident
  prediction_entropy?: number;
}

const VoiceRecorder: React.FC = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [playbackStatus, setPlaybackStatus] = useState<AVPlaybackStatus | null>(
    null
  );
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [classificationResult, setClassificationResult] =
    useState<FlaskApiResponse | null>(null);

  // Animation pour le bouton d'enregistrement
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation();
  const { sendMessage, startMedicalConsultation } = useChat();

  // Configuration de l'API Flask
  const API_CONFIG = {
    baseUrl: "http://192.168.218.101:5002", // Remplacez par l'IP de votre serveur Flask
    authBaseUrl: "http://192.168.218.101:5001",
    endpoint: "/classify",
    healthEndpoint: "/health",
    timeout: 60000, // 60 secondes pour le traitement audio
  };

  // Test de connexion au serveur Flask
  const testFlaskConnection = async (): Promise<boolean> => {
    try {
      console.log("Test de connexion au serveur Flask...");
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.healthEndpoint}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Serveur Flask connecté:", result);
        return true;
      } else {
        console.log("❌ Serveur Flask non disponible");
        return false;
      }
    } catch (error) {
      console.log("❌ Erreur de connexion Flask:", error);
      return false;
    }
  };

  // Formater le temps en mm:ss
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Animation de pulsation pendant l'enregistrement
  const startPulseAnimation = (): void => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = (): void => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // FIXED: Fonction pour envoyer l'audio à l'API Flask
  // MODIFIED: Update the sendAudioToFlask function
  const sendAudioToFlask = async (audioFileUri: string): Promise<void> => {
    setIsUploading(true);
    setClassificationResult(null);

    try {
      console.log("🔄 Préparation de l'envoi vers Flask API...");
      console.log("📁 URI du fichier audio:", audioFileUri);

      // Test de connexion d'abord
      const isConnected = await testFlaskConnection();
      if (!isConnected) {
        throw new Error(
          "Serveur Flask non disponible. Vérifiez que le serveur est démarré et accessible."
        );
      }

      // FIXED: Format d'ajout du fichier audio
      const formData = new FormData();
      formData.append("audio", {
        uri: audioFileUri,
        type: "audio/m4a",
        name: `recording_${Date.now()}.m4a`,
      } as any);

      console.log("📤 Envoi du fichier audio à Flask...");
      console.log(
        "🌐 URL complète:",
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoint}`
      );

      // Envoyer à l'API Flask avec timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.timeout
      );

      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoint}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formData,
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      console.log("📊 Statut de la réponse:", response.status);
      console.log(
        "📋 Headers de la réponse:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erreur de la réponse:", errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const result: FlaskApiResponse = await response.json();
      console.log("✅ Résultat de la classification:", result);

      // FIXED: Check for success flag first
      if (!result.success || result.error) {
        throw new Error(result.error || "Classification échouée");
      }

      // Stocker le résultat pour l'affichage
      setClassificationResult(result);

      // NEW: Send predicted disease to chatbot and navigate
      if (result.predicted_disease) {
        try {
          console.log("🩺 Maladie prédite:", result.predicted_disease);

          // ✅ D'abord démarrer une nouvelle consultation SANS envoyer la maladie
          startMedicalConsultation(); // Pas de paramètre ici !

          // ✅ Attendre que la consultation soit initialisée
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // ✅ Naviguer vers le chat
          navigation.navigate("chat" as never);

          // ✅ Attendre que la navigation soit complète et envoyer UNE SEULE FOIS
          setTimeout(async () => {
            try {
              console.log("📤 Envoi de la maladie prédite au chatbot...");
              await sendMessage(result.predicted_disease);
              console.log("✅ Maladie envoyée avec succès");
            } catch (sendError) {
              console.error("❌ Erreur lors de l'envoi:", sendError);
            }
          }, 2000); // Délai plus long pour être sûr

          console.log("✅ Navigation vers le chat effectuée");
        } catch (chatError) {
          console.error("❌ Erreur lors de l'envoi au chatbot:", chatError);
          showClassificationResult(result);
        }
      } else {
        showClassificationResult(result);
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi vers Flask:", error);

      let errorMessage = "Erreur inconnue";
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage =
            "Timeout - Le serveur met trop de temps à répondre (>60s)";
        } else if (
          error.message.includes("Network request failed") ||
          error.message.includes("fetch")
        ) {
          errorMessage =
            "Erreur réseau - Vérifiez que le serveur Flask est démarré et accessible";
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert(
        "❌ Erreur de Classification",
        `Impossible de classifier l'audio:\n\n${errorMessage}\n\nVérifiez:\n• Serveur Flask démarré\n• Adresse IP correcte\n• Connexion réseau`,
        [{ text: "OK" }]
      );
    } finally {
      setIsUploading(false);
    }
  };

  // FIXED: Afficher le résultat de classification
  const showClassificationResult = (result: FlaskApiResponse): void => {
    if (!result.predicted_disease) {
      Alert.alert(
        "❌ Erreur",
        "Résultat de classification invalide - aucune maladie prédite"
      );
      return;
    }

    const confidence = result.confidence || 0;
    const confidencePercent = result.confidence_percent || "0%";
    const confidenceLevel = result.confidence_level || "Inconnue";

    // Déterminer l'emoji de confiance basé sur confidence_level
    let confidenceEmoji = "";
    switch (confidenceLevel.toLowerCase()) {
      case "very high":
        confidenceEmoji = "🟢";
        break;
      case "high":
        confidenceEmoji = "🟡";
        break;
      case "medium":
        confidenceEmoji = "🟠";
        break;
      case "low":
      case "very low":
        confidenceEmoji = "🔴";
        break;
      default:
        confidenceEmoji = "⚪";
    }

    const reliabilityText = result.is_reliable ? "✅ Fiable" : "⚠️ Peu fiable";

    Alert.alert(
      "🩺 Classification Médicale",
      `Maladie prédite: ${result.predicted_disease}\n` +
        `Confiance: ${confidenceEmoji} ${confidencePercent} (${confidenceLevel})\n` +
        `Fiabilité: ${reliabilityText}\n` +
        `Fichier: ${result.audio_file || "N/A"}`,
      [
        { text: "Détails", onPress: () => showDetailedResult(result) },
        { text: "OK", style: "default" },
      ]
    );
  };

  // FIXED: Afficher les détails complets
  const showDetailedResult = (result: FlaskApiResponse): void => {
    const entropy = result.prediction_entropy || 0;

    Alert.alert(
      "📊 Détails de Classification",
      `🩺 Maladie: ${result.predicted_disease}\n` +
        `📈 Confiance: ${result.confidence_percent} (${result.confidence_level})\n` +
        `🎯 Fiabilité: ${result.is_reliable ? "Oui" : "Non"}\n` +
        `📊 Entropie: ${entropy.toFixed(3)}\n` +
        `📁 Fichier: ${result.audio_file}\n\n` +
        `ℹ️ Une entropie faible indique une prédiction plus certaine.\n` +
        `ℹ️ Fiabilité basée sur un seuil de confiance de 50%.`,
      [{ text: "Fermer" }]
    );
  };

  // Démarrer l'enregistrement
  const startRecording = async (): Promise<void> => {
    try {
      console.log("🎤 Demande de permissions...");

      // Demander les permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "Nous avons besoin de votre permission pour accéder au microphone."
        );
        return;
      }

      console.log("⚙️ Configuration du mode audio...");

      // Configurer le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // OPTIMIZED: Options d'enregistrement pour la classification
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: ".wav",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100, // Correspond à librosa.load(sr=None)
          numberOfChannels: 1, // Mono pour la classification
          bitRate: 128000,
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100, // Correspond à librosa.load(sr=None)
          numberOfChannels: 1, // Mono pour la classification
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/wav",
          bitsPerSecond: 128000,
        },
      };

      console.log("🎬 Démarrage de l'enregistrement...");

      // Créer et démarrer l'enregistrement
      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions
      );
      setRecording(newRecording);
      setIsRecording(true);
      setClassificationResult(null); // Reset du résultat précédent
      startPulseAnimation();

      console.log("✅ Enregistrement démarré avec succès");

      // Mettre à jour la durée d'enregistrement
      newRecording.setOnRecordingStatusUpdate((status: RecordingStatus) => {
        if (status.isRecording && status.durationMillis) {
          setRecordingDuration(status.durationMillis);
        }
      });
    } catch (err) {
      console.error("❌ Erreur lors du démarrage de l'enregistrement:", err);
      Alert.alert("Erreur", "Impossible de démarrer l'enregistrement.");
    }
  };

  // Arrêter l'enregistrement
  const stopRecording = async (): Promise<void> => {
    try {
      if (!recording) return;

      console.log("⏹️ Arrêt de l'enregistrement...");

      setIsRecording(false);
      stopPulseAnimation();
      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();
      console.log("📁 URI de l'enregistrement:", uri);

      if (uri) {
        setAudioUri(uri);

        // Proposer d'envoyer immédiatement pour classification
        Alert.alert(
          "🎵 Enregistrement terminé",
          "Voulez-vous classifier cet audio maintenant ?",
          [
            { text: "Plus tard", style: "cancel" },
            {
              text: "Classifier",
              onPress: () => sendAudioToFlask(uri),
            },
          ]
        );
      }
      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error("❌ Erreur lors de l'arrêt de l'enregistrement:", error);
      Alert.alert(
        "Erreur",
        "Problème lors de la sauvegarde de l'enregistrement."
      );
    }
  };

  // Lire l'enregistrement
  const playRecording = async (): Promise<void> => {
    try {
      if (!audioUri) {
        Alert.alert("Erreur", "Aucun enregistrement disponible.");
        return;
      }

      if (sound) {
        await sound.unloadAsync();
      }

      console.log("▶️ Démarrage de la lecture...");

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      // Suivre le statut de lecture
      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        setPlaybackStatus(status);
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("❌ Erreur lors de la lecture:", error);
      Alert.alert("Erreur", "Impossible de lire l'enregistrement.");
    }
  };

  // Arrêter la lecture
  const stopPlaying = async (): Promise<void> => {
    try {
      if (sound) {
        await sound.stopAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'arrêt de la lecture:", error);
    }
  };

  // Fonction pour classifier manuellement
  const handleClassifyAudio = (): void => {
    if (!audioUri) {
      Alert.alert("Erreur", "Aucun enregistrement disponible à classifier.");
      return;
    }

    Alert.alert(
      "🤖 Classifier l'audio",
      "Envoyer cet enregistrement au classificateur IA pour prédire la maladie ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Classifier",
          onPress: () => sendAudioToFlask(audioUri),
        },
      ]
    );
  };

  // Test de connexion au démarrage
  useEffect(() => {
    testFlaskConnection();
  }, []);

  // Nettoyer les ressources audio
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [recording, sound]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Text style={styles.appName}>RespiraSense</Text>
        <Text style={styles.subtitle}>Analyse audio respiratoire</Text>
      </View>

      {/* Time Display */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {isRecording
            ? `🔴 ${formatTime(recordingDuration)}`
            : playbackStatus?.isLoaded && "positionMillis" in playbackStatus
            ? `🔊 ${formatTime(playbackStatus.positionMillis || 0)}`
            : "⏸️ 00:00"}
        </Text>
      </View>

      {/* Classification Result */}
      {classificationResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>🩺 Diagnostic</Text>
          <Text style={styles.resultDisease}>
            {classificationResult.predicted_disease}
          </Text>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() =>
              classificationResult && showDetailedResult(classificationResult)
            }
          >
            <Text style={styles.detailsButtonText}>Détails</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Indicator */}
      {isUploading && (
        <View style={styles.uploadContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.uploadText}>Analyse en cours...</Text>
        </View>
      )}

      {/* Main Controls - All buttons in one line */}
      <View style={styles.controlsContainer}>
        <View style={styles.mainControlsRow}>
          {/* Record Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isRecording ? styles.recordingActive : styles.recordingInactive,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isPlaying || isUploading}
            >
              <Text style={styles.actionButtonIcon}>
                {isRecording ? "⏹️" : "🎤"}
              </Text>
              <Text style={styles.actionButtonText}>
                {isRecording ? "Arrêter" : "Enregistrer"}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Play Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.playButton,
              !audioUri || isRecording || isUploading ? styles.disabled : {},
            ]}
            onPress={isPlaying ? stopPlaying : playRecording}
            disabled={!audioUri || isRecording || isUploading}
          >
            <Text style={styles.actionButtonIcon}>
              {isPlaying ? "⏸️" : "▶️"}
            </Text>
            <Text style={styles.actionButtonText}>
              {isPlaying ? "Pause" : "Écouter"}
            </Text>
          </TouchableOpacity>

          {/* Diagnose Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.diagnoseButton,
              !audioUri || isRecording || isUploading ? styles.disabled : {},
            ]}
            onPress={handleClassifyAudio}
            disabled={!audioUri || isRecording || isUploading}
          >
            <Text style={styles.actionButtonIcon}>🤖</Text>
            <Text style={styles.actionButtonText}>Diagnostiquer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isUploading
            ? "🤖 Analyse IA en cours..."
            : isRecording
            ? "🔴 Enregistrement..."
            : isPlaying
            ? "🔊 Lecture..."
            : audioUri
            ? classificationResult
              ? "✅ Audio analysé"
              : "📁 Prêt à analyser"
            : "⏳ Prêt à enregistrer"}
        </Text>
      </View>

      {/* Conseils d'utilisation */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Conseils d'utilisation</Text>
        <View style={styles.tipsList}>
          <Text style={styles.tipItem}>
            • Trouvez un endroit calme pour l'enregistrement
          </Text>
          <Text style={styles.tipItem}>
            • Respirez normalement pendant 10-15 secondes
          </Text>
          <Text style={styles.tipItem}>
            • Tenez l'appareil près de votre bouche
          </Text>
          <Text style={styles.tipItem}>
            • Écoutez votre enregistrement avant le diagnostic
          </Text>
          <Text style={styles.tipItem}>
            • Les résultats sont indicatifs, consultez un médecin
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F8FAFB",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 5,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "400",
  },
  timeContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timeText: {
    fontSize: 20,
    color: "#1E293B",
    fontWeight: "600",
    fontFamily: "monospace",
  },
  resultContainer: {
    backgroundColor: "#F0FDF4",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#15803D",
    marginBottom: 8,
  },
  resultDisease: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 6,
    textAlign: "center",
  },
  resultConfidence: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
  },
  resultReliability: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 12,
    fontWeight: "500",
  },
  detailsButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  detailsButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  uploadContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadText: {
    fontSize: 16,
    color: "#1E293B",
    marginTop: 12,
    fontWeight: "500",
  },
  controlsContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  mainControlsRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 90,
    flex: 1,
    maxWidth: 110,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordingActive: {
    backgroundColor: "#EF4444",
  },
  recordingInactive: {
    backgroundColor: "#10B981",
  },
  playButton: {
    backgroundColor: "#4A90E2",
  },
  diagnoseButton: {
    backgroundColor: "#8B5CF6",
  },
  actionButtonIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
  statusContainer: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
  tipsContainer: {
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4A90E2",
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  tipsList: {
    gap: 6,
  },
  tipItem: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 18,
  },
});

export default VoiceRecorder;
