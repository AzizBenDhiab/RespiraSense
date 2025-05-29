import { Audio, AVPlaybackStatus } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useRef, useState } from 'react';
import {
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

const VoiceRecorder: React.FC = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [playbackStatus, setPlaybackStatus] = useState<AVPlaybackStatus | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  
  // Animation pour le bouton d'enregistrement
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
      }
      setRecording(null);
      setRecordingDuration(0);

      // Optionnel: Sauvegarder dans la galerie
      // if (uri) await saveToMediaLibrary(uri);

      Alert.alert(
        'Enregistrement terminé',
        'Votre enregistrement respiratoire a été sauvegardé avec succès.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
      Alert.alert('Erreur', 'Problème lors de la sauvegarde de l\'enregistrement.');
    }
  };

  // Sauvegarder dans la galerie (optionnel)
  const saveToMediaLibrary = async (uri: string): Promise<void> => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde en galerie:', error);
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
      <Text style={styles.title}>Diagnostic Respiratoire</Text>
      <Text style={styles.subtitle}>Enregistrement Audio</Text>

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
            disabled={isPlaying}
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
            (!audioUri || isRecording) ? styles.disabled : {}
          ]}
          onPress={isPlaying ? stopPlaying : playRecording}
          disabled={!audioUri || isRecording}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? '⏸️ Pause' : '▶️ Écouter'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>📋 Instructions</Text>
        <Text style={styles.instructionsText}>
          • Placez le téléphone près de votre poitrine{'\n'}
          • Respirez normalement et profondément{'\n'}
          • Enregistrez pendant 15-30 secondes{'\n'}
          • Évitez les bruits environnants{'\n'}
          • Restez immobile pendant l'enregistrement
        </Text>
      </View>

      {/* Statut */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isRecording 
            ? '🔴 Enregistrement en cours...'
            : isPlaying 
              ? '🔊 Lecture en cours...'
              : audioUri 
                ? '✅ Enregistrement prêt'
                : '⏳ Prêt à enregistrer'
          }
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
    marginBottom: 30,
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
  controlsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
  },
  recordButton: {
    paddingVertical: 18,
    paddingHorizontal: 35,
    borderRadius: 30,
    minWidth: 140,
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
    paddingHorizontal: 35,
    borderRadius: 30,
    minWidth: 140,
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
  },
  statusText: {
    fontSize: 14,
    color: '#34495e',
    fontWeight: '500',
  },
});

export default VoiceRecorder;