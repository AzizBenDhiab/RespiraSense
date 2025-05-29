import { Audio, AVPlaybackStatus } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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

// Types pour la réponse de l'API
interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
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
  
  // Animation pour le bouton d'enregistrement
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Configuration de l'API
  const API_CONFIG = {
    baseUrl: 'https://your-backend-api.com', // Remplacez par votre URL
    endpoint: '/api/upload-audio',
    timeout: 30000, // 30 secondes
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

  // Fonction pour envoyer l'audio à l'API
  const sendAudioToAPI = async (audioFileUri: string): Promise<void> => {
    setIsUploading(true);

    try {
      // Créer FormData pour envoyer le fichier
      const formData = new FormData();
      
      // Ajouter le fichier audio
      formData.append('audio', {
        uri: audioFileUri,
        type: 'audio/m4a',
        name: `recording_${Date.now()}.m4a`,
      } as any);

      // Ajouter des métadonnées optionnelles
      formData.append('metadata', JSON.stringify({
        duration: recordingDuration,
        timestamp: new Date().toISOString(),
        recordingId: `rec_${Date.now()}`,
      }));

      console.log('Envoi du fichier audio à l\'API...');

      // Envoyer à l'API
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          // Ajoutez vos headers d'authentification ici si nécessaire
          // 'Authorization': `Bearer ${yourToken}`,
          // 'X-API-Key': 'your-api-key',
        },
        body: formData,
      });

      const result: ApiResponse = await response.json();

      if (response.ok && result.success) {
        Alert.alert(
          '✅ Envoi réussi',
          result.message || 'Le fichier audio a été envoyé avec succès !',
          [{ text: 'OK' }]
        );
        console.log('Réponse API:', result);
      } else {
        throw new Error(result.error || `Erreur HTTP: ${response.status}`);
      }

    } catch (error) {
      if (error instanceof Error) {
      console.error('Erreur lors de l\'envoi:', error);
      Alert.alert(
        '❌ Erreur d\'envoi',
        `Impossible d'envoyer le fichier: ${error.message}`,
        [{ text: 'OK' }]
      );}
    } finally {
      setIsUploading(false);
    }
  };

  // Fonction mock pour tester sans backend
  const testApiCall = async (): Promise<void> => {
    setIsUploading(true);
    
    try {
      console.log('Test d\'envoi API...');
      
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simuler une réponse réussie
      Alert.alert(
        '✅ Test réussi',
        'La simulation d\'envoi API a fonctionné !\n\nQuand votre backend sera prêt, remplacez testApiCall() par sendAudioToAPI() dans le code.',
        [{ text: 'OK' }]
      );
      
      console.log('Test API terminé avec succès');
      
    } catch (error) {
      console.error('Erreur test API:', error);
      Alert.alert('❌ Erreur de test', 'Erreur lors du test d\'API');
    } finally {
      setIsUploading(false);
    }
  };

  // Démarrer l'enregistrement
  const startRecording = async (): Promise<void> => {
    try {
      // Demander les permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Nous avons besoin de votre permission pour accéder au microphone.'
        );
        return;
      }

      // Configurer le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Options d'enregistrement
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      // Créer et démarrer l'enregistrement
      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(newRecording);
      setIsRecording(true);
      startPulseAnimation();

      // Mettre à jour la durée d'enregistrement
      newRecording.setOnRecordingStatusUpdate((status: RecordingStatus) => {
        if (status.isRecording && status.durationMillis) {
          setRecordingDuration(status.durationMillis);
        }
      });

    } catch (err) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', err);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
    }
  };

  // Arrêter l'enregistrement
  const stopRecording = async (): Promise<void> => {
    try {
      if (!recording) return;

      setIsRecording(false);
      stopPulseAnimation();
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      if (uri) {
        setAudioUri(uri);
        
        // Proposer d'envoyer immédiatement
        Alert.alert(
          'Enregistrement terminé',
          'Voulez-vous envoyer ce fichier audio maintenant ?',
          [
            { text: 'Plus tard', style: 'cancel' },
            { 
              text: 'Envoyer', 
              onPress: () => {
                // Utilisez testApiCall() pour tester sans backend
                // Remplacez par sendAudioToAPI(uri) quand le backend sera prêt
                testApiCall();
              }
            }
          ]
        );
      }
      setRecording(null);
      setRecordingDuration(0);

    } catch (error) {
      console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
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
      console.error('Erreur lors de la lecture:', error);
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
      console.error('Erreur lors de l\'arrêt de la lecture:', error);
    }
  };

  // Fonction pour envoyer manuellement
  const handleSendAudio = (): void => {
    if (!audioUri) {
      Alert.alert('Erreur', 'Aucun enregistrement disponible à envoyer.');
      return;
    }

    Alert.alert(
      'Envoyer l\'audio',
      'Êtes-vous sûr de vouloir envoyer cet enregistrement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Envoyer', 
          onPress: () => {
            // Utilisez testApiCall() pour tester sans backend
            // Remplacez par sendAudioToAPI(audioUri) quand le backend sera prêt
            testApiCall();
          }
        }
      ]
    );
  };

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
    <View style={styles.container}>
      <Text style={styles.title}>Enregistrement Audio</Text>
      <Text style={styles.subtitle}>Enregistrer et Envoyer</Text>

      {/* Affichage du temps */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {isRecording 
            ? `Enregistrement: ${formatTime(recordingDuration)}`
            : playbackStatus?.isLoaded && 'positionMillis' in playbackStatus
              ? `Lecture: ${formatTime(playbackStatus.positionMillis || 0)}`
              : '00:00'
          }
        </Text>
      </View>

      {/* Indicateur d'upload */}
      {isUploading && (
        <View style={styles.uploadContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.uploadText}>Envoi en cours...</Text>
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

        {/* Bouton d'envoi */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!audioUri || isRecording || isUploading) ? styles.disabled : {}
          ]}
          onPress={handleSendAudio}
          disabled={!audioUri || isRecording || isUploading}
        >
          <Text style={styles.sendButtonText}>
            📤 Envoyer
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>📋 Instructions</Text>
        <Text style={styles.instructionsText}>
          • Appuyez sur "Enregistrer" pour commencer{'\n'}
          • Parlez ou respirez près du microphone{'\n'}
          • Appuyez sur "Arrêter" pour terminer{'\n'}
          • Utilisez "Écouter" pour vérifier{'\n'}
          • Cliquez "Envoyer" pour transmettre le fichier
        </Text>
      </View>

      {/* Statut */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isUploading
            ? '📤 Envoi en cours...'
            : isRecording 
              ? '🔴 Enregistrement en cours...'
              : isPlaying 
                ? '🔊 Lecture en cours...'
                : audioUri 
                  ? '✅ Prêt à envoyer'
                  : '⏳ Prêt à enregistrer'
          }
        </Text>
      </View>

      {/* Info développeur */}
      <View style={styles.devInfoContainer}>
        <Text style={styles.devInfoText}>
          💻 Mode développement: Test API actif{'\n'}
          Remplacez testApiCall() par sendAudioToAPI() dans le code
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
  },
  timeContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    marginBottom: 20,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timeText: {
    fontSize: 20,
    color: '#2c3e50',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  uploadContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadText: {
    fontSize: 16,
    color: '#2c3e50',
    marginTop: 10,
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sendButton: {
    backgroundColor: '#f39c12',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 30,
    minWidth: 130,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  sendButtonText: {
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  },
  devInfoContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    maxWidth: 320,
  },
  devInfoText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default VoiceRecorder;