import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const LoginHeader = () => (
  <View style={styles.header}>
    <Ionicons name="medical" size={80} color="#2E86AB" />
    <Text style={styles.title}>RespiraSense</Text>
    <Text style={styles.subtitle}>Your Respiratory Health Companion</Text>
  </View>
);

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2E86AB' },
  subtitle: { fontSize: 14, color: '#666' },
});
