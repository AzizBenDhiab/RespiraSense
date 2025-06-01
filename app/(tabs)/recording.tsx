import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import VoiceRecorder from '../../components/VoiceRecorder';

export default function RecordingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <VoiceRecorder />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});