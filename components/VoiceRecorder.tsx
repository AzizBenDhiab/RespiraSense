import { Audio, AVPlaybackStatus } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const [playbackStatus, setPlaybackStatus] = useState<AVPlaybackStatus | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [classificationResult, setClassificationResult] = useState<FlaskApiResponse | null>(null);
  
  // Animation pour le bouton d'enregistrement
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Configuration de l'API Flask - UPDATED
  const API_CONFIG = {
    baseUrl: 'http://172.20.10.9:5000', // Remplacez par l'IP de votre serveur Flask
    endpoint: '/classify',
    healthEndpoint: '/health',
    timeout: 60000, // 60 secondes pour le traitement audio
  };

  // Test de connexion au serveur Flask
  const testFlaskConnection = async (): Promise<boolean> => {
    try {
      console.log('Test de connexion au serveur Flask...');
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.healthEndpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Serveur Flask connecté:', result);
        return true;
      } else {
        console.log('❌ Serveur Flask non disponible');
        return false;
      }
    } catch (error) {
      console.log('❌ Erreur de connexion Flask:', error);
      return false;
    }
  };

  // Formater le temps en mm:ss
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
  const sendAudioToFlask = async (audioFileUri: string): Promise<void> => {
    setIsUploading(true);
    setClassificationResult(null);

    try {
      console.log('🔄 Préparation de l\'envoi vers Flask API...');
      console.log('📁 URI du fichier audio:', audioFileUri);

      // Test de connexion d'abord
      const isConnected = await testFlaskConnection();
      if (!isConnected) {
        throw new Error('Serveur Flask non disponible. Vérifiez que le serveur est démarré et accessible.');
      }

     
      
      // FIXED: Format d'ajout du fichier audio
      const formData = new FormData();
      formData.append('audio', {
        uri: audioFileUri,
        type: 'audio/m4a',
        name: `recording_${Date.now()}.m4a`,
      } as any);

      console.log('📤 Envoi du fichier audio à Flask...');
      console.log('🌐 URL complète:', `${API_CONFIG.baseUrl}${API_CONFIG.endpoint}`);

      // Envoyer à l'API Flask avec timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoint}`, {
        method: 'POST',
        headers: {
          // FIXED: Removed Content-Type to let browser set boundary for multipart/form-data
          'Accept': 'application/json',
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📊 Statut de la réponse:', response.status);
      console.log('📋 Headers de la réponse:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur de la réponse:', errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const result: FlaskApiResponse = await response.json();
      console.log('✅ Résultat de la classification:', result);

      // FIXED: Check for success flag first
      if (!result.success || result.error) {
        throw new Error(result.error || 'Classification échouée');
      }

      // Stocker le résultat pour l'affichage
      setClassificationResult(result);

      // Afficher le résultat
      showClassificationResult(result);

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi vers Flask:', error);
      
      let errorMessage = 'Erreur inconnue';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Timeout - Le serveur met trop de temps à répondre (>60s)';
        } else if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
          errorMessage = 'Erreur réseau - Vérifiez que le serveur Flask est démarré et accessible';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert(
        '❌ Erreur de Classification',
        `Impossible de classifier l'audio:\n\n${errorMessage}\n\nVérifiez:\n• Serveur Flask démarré\n• Adresse IP correcte\n• Connexion réseau`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
    }
  };

  // FIXED: Afficher le résultat de classification
  const showClassificationResult = (result: FlaskApiResponse): void => {
    if (!result.predicted_disease) {
      Alert.alert('❌ Erreur', 'Résultat de classification invalide - aucune maladie prédite');
      return;
    }

    const confidence = result.confidence || 0;
    const confidencePercent = result.confidence_percent || '0%';
    const confidenceLevel = result.confidence_level || 'Inconnue';
    
    // Déterminer l'emoji de confiance basé sur confidence_level
    let confidenceEmoji = '';
    switch (confidenceLevel.toLowerCase()) {
      case 'very high':
        confidenceEmoji = '🟢';
        break;
      case 'high':
        confidenceEmoji = '🟡';
        break;
      case 'medium':
        confidenceEmoji = '🟠';
        break;
      case 'low':
      case 'very low':
        confidenceEmoji = '🔴';
        break;
      default:
        confidenceEmoji = '⚪';
    }

    const reliabilityText = result.is_reliable ? '✅ Fiable' : '⚠️ Peu fiable';

    Alert.alert(
      '🩺 Classification Médicale',
      `Maladie prédite: ${result.predicted_disease}\n` +
      `Confiance: ${confidenceEmoji} ${confidencePercent} (${confidenceLevel})\n` +
      `Fiabilité: ${reliabilityText}\n` +
      `Fichier: ${result.audio_file || 'N/A'}`,
      [
        { text: 'Détails', onPress: () => showDetailedResult(result) },
        { text: 'OK', style: 'default' }
      ]
    );
  };

  // FIXED: Afficher les détails complets
  const showDetailedResult = (result: FlaskApiResponse): void => {
    const entropy = result.prediction_entropy || 0;
    
    Alert.alert(
      '📊 Détails de Classification',
      `🩺 Maladie: ${result.predicted_disease}\n` +
      `📈 Confiance: ${result.confidence_percent} (${result.confidence_level})\n` +
      `🎯 Fiabilité: ${result.is_reliable ? 'Oui' : 'Non'}\n` +
      `📊 Entropie: ${entropy.toFixed(3)}\n` +
      `📁 Fichier: ${result.audio_file}\n\n` +
      `ℹ️ Une entropie faible indique une prédiction plus certaine.\n` +
      `ℹ️ Fiabilité basée sur un seuil de confiance de 50%.`,
      [{ text: 'Fermer' }]
    );
  };

  // Démarrer l'enregistrement
  const startRecording = async (): Promise<void> => {
    try {
      console.log('🎤 Demande de permissions...');
      
      // Demander les permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Nous avons besoin de votre permission pour accéder au microphone.'
        );
        return;
      }

      console.log('⚙️ Configuration du mode audio...');
      
      // Configurer le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // OPTIMIZED: Options d'enregistrement pour la classification
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100, // Correspond à librosa.load(sr=None)
          numberOfChannels: 1, // Mono pour la classification
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
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
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      };

      console.log('🎬 Démarrage de l\'enregistrement...');
      
      // Créer et démarrer l'enregistrement
      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(newRecording);
      setIsRecording(true);
      setClassificationResult(null); // Reset du résultat précédent
      startPulseAnimation();

      console.log('✅ Enregistrement démarré avec succès');

      // Mettre à jour la durée d'enregistrement
      newRecording.setOnRecordingStatusUpdate((status: RecordingStatus) => {
        if (status.isRecording && status.durationMillis) {
          setRecordingDuration(status.durationMillis);
        }
      });

    } catch (err) {
      console.error('❌ Erreur lors du démarrage de l\'enregistrement:', err);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
    }
  };

  // Arrêter l'enregistrement
  const stopRecording = async (): Promise<void> => {
    try {
      if (!recording) return;

      console.log('⏹️ Arrêt de l\'enregistrement...');
      
      setIsRecording(false);
      stopPulseAnimation();
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      console.log('📁 URI de l\'enregistrement:', uri);
      
      if (uri) {
        setAudioUri(uri);
        
        // Proposer d'envoyer immédiatement pour classification
        Alert.alert(
          '🎵 Enregistrement terminé',
          'Voulez-vous classifier cet audio maintenant ?',
          [
            { text: 'Plus tard', style: 'cancel' },
            { 
              text: 'Classifier', 
              onPress: () => sendAudioToFlask(uri)
            }
          ]
        );
      }
      setRecording(null);
      setRecordingDuration(0);

    } catch (error) {
      console.error('❌ Erreur lors de l\'arrêt de l\'enregistrement:', error);
      Alert.alert('Erreur', 'Problème lors de la sauvegarde de l\'enregistrement.');
    }
  };

  // Lire l'enregistrement
  const playRecording = async (): Promise<void> => {
    try {
      if (!audioUri) {
        Alert.alert('Erreur', 'Aucun enregistrement disponible.');
        return;
      }

      if (sound) {
        await sound.unloadAsync();
      }

      console.log('▶️ Démarrage de la lecture...');
      
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
      console.error('❌ Erreur lors de la lecture:', error);
      Alert.alert('Erreur', 'Impossible de lire l\'enregistrement.');
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
      console.error('❌ Erreur lors de l\'arrêt de la lecture:', error);
    }
  };

  // Fonction pour classifier manuellement
  const handleClassifyAudio = (): void => {
    if (!audioUri) {
      Alert.alert('Erreur', 'Aucun enregistrement disponible à classifier.');
      return;
    }

    Alert.alert(
      '🤖 Classifier l\'audio',
      'Envoyer cet enregistrement au classificateur IA pour prédire la maladie ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Classifier', 
          onPress: () => sendAudioToFlask(audioUri)
        }
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
      <Text style={styles.title}>🩺 Classificateur Audio Médical</Text>
      <Text style={styles.subtitle}>Enregistrer • Classifier • Diagnostiquer</Text>

      {/* Affichage du temps */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {isRecording 
            ? `🔴 Enregistrement: ${formatTime(recordingDuration)}`
            : playbackStatus?.isLoaded && 'positionMillis' in playbackStatus
              ? `🔊 Lecture: ${formatTime(playbackStatus.positionMillis || 0)}`
              : '⏸️ 00:00'
          }
        </Text>
      </View>

      {/* FIXED: Résultat de classification */}
      {classificationResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>🩺 Diagnostic IA</Text>
          <Text style={styles.resultDisease}>
            Maladie: {classificationResult.predicted_disease}
          </Text>
          <Text style={styles.resultConfidence}>
            Confiance: {classificationResult.confidence_percent} ({classificationResult.confidence_level})
          </Text>
          <Text style={styles.resultReliability}>
            {classificationResult.is_reliable ? '✅ Résultat fiable' : '⚠️ Résultat peu fiable'}
          </Text>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => classificationResult && showDetailedResult(classificationResult)}
          >
            <Text style={styles.detailsButtonText}>📊 Voir détails</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Indicateur d'upload */}
      {isUploading && (
        <View style={styles.uploadContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.uploadText}>🤖 Classification en cours...</Text>
          <Text style={styles.uploadSubText}>Analyse du spectrogramme mel...</Text>
        </View>
      )}

      {/* Boutons de contrôle */}
      <View style={styles.controlsContainer}>
        {/* Bouton d'enregistrement */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording ? styles.recordingActive : styles.recordingInactive
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isPlaying || isUploading}
          >
            <Text style={styles.recordButtonText}>
              {isRecording ? '⏹️ Arrêter' : '🎤 Enregistrer'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bouton de lecture */}
        <TouchableOpacity
          style={[
            styles.playButton,
            (!audioUri || isRecording || isUploading) ? styles.disabled : {}
          ]}
          onPress={isPlaying ? stopPlaying : playRecording}
          disabled={!audioUri || isRecording || isUploading}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? '⏸️ Pause' : '▶️ Écouter'}
          </Text>
        </TouchableOpacity>

        {/* Bouton de classification */}
        <TouchableOpacity
          style={[
            styles.classifyButton,
            (!audioUri || isRecording || isUploading) ? styles.disabled : {}
          ]}
          onPress={handleClassifyAudio}
          disabled={!audioUri || isRecording || isUploading}
        >
          <Text style={styles.classifyButtonText}>
            🤖 Diagnostiquer
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>📋 Instructions</Text>
        <Text style={styles.instructionsText}>
          • Appuyez sur "Enregistrer" pour capturer l'audio médical{'\n'}
          • Parlez clairement près du microphone{'\n'}
          • Appuyez sur "Arrêter" pour terminer l'enregistrement{'\n'}
          • Utilisez "Écouter" pour vérifier l'audio{'\n'}
          • Cliquez "Diagnostiquer" pour l'analyse IA
        </Text>
      </View>

      {/* Configuration API */}
      <View style={styles.apiInfoContainer}>
        <Text style={styles.apiInfoTitle}>🔧 Configuration API</Text>
        <Text style={styles.apiInfoText}>
          Serveur Flask: {API_CONFIG.baseUrl}{'\n'}
          Endpoint: {API_CONFIG.endpoint}{'\n'}
          Health: {API_CONFIG.healthEndpoint}{'\n'}
          Timeout: {API_CONFIG.timeout/1000}s
        </Text>
      </View>

      {/* Statut */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isUploading
            ? '🤖 Classification IA en cours...'
            : isRecording 
              ? '🔴 Enregistrement en cours...'
              : isPlaying 
                ? '🔊 Lecture en cours...'
                : audioUri 
                  ? classificationResult 
                    ? '✅ Audio diagnostiqué'
                    : '📁 Prêt à diagnostiquer'
                  : '⏳ Prêt à enregistrer'
        }
        </Text>
      </View>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
    textAlign: 'center',
  },
  timeContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    marginBottom: 20,
    minWidth: 250,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timeText: {
    fontSize: 18,
    color: '#2c3e50',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  resultContainer: {
    backgroundColor: '#e8f5e8',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    minWidth: 280,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#27ae60',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 10,
  },
  resultClass: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultConfidence: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 15,
  },
  detailsButton: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  detailsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadText: {
    fontSize: 16,
    color: '#2c3e50',
    marginTop: 10,
    fontWeight: '600',
  },
  uploadSubText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  recordButton: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 30,
    minWidth: 130,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  recordingActive: {
    backgroundColor: '#e74c3c',
  },
  recordingInactive: {
    backgroundColor: '#27ae60',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playButton: {
    backgroundColor: '#3498db',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 30,
    minWidth: 130,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  resultDisease: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultReliability: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  classifyButton: {
    backgroundColor: '#9b59b6',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 30,
    minWidth: 130,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  classifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
    elevation: 0,
  },
  instructionsContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    maxWidth: 320,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  apiInfoContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    maxWidth: 320,
    marginBottom: 20,
  },
  apiInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  apiInfoText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
    fontFamily: 'monospace',
  },
  statusContainer: {
    backgroundColor: '#ecf0f1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 15,
  },
  statusText: {
    fontSize: 14,
    color: '#34495e',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default VoiceRecorder;