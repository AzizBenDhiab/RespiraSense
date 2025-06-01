import { Image } from "expo-image";
import { Platform, StyleSheet } from "react-native";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import VoiceRecorder from '@/components/VoiceRecorder';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const HomeScreen: React.FC = () => {
  const router = useRouter();

  // Navigation handlers
  const navigateToProfile = () => {
    router.push('/profile');
  };

  const navigateToPreviousChats = () => {
    router.push('/chats');
  };

  // const handleLogout = () => {
  //   Alert.alert(
  //     'Déconnexion',
  //     'Êtes-vous sûr de vouloir vous déconnecter ?',
  //     [
  //       {
  //         text: 'Annuler',
  //         style: 'cancel',
  //       },
  //       {
  //         text: 'Déconnexion',
  //         style: 'destructive',
  //         onPress: () => {
  //           // Add your logout logic here
  //           // Clear AsyncStorage, reset auth state, etc.
  //           console.log('User logged out');
  //           router.replace('/login'); // Navigate to login screen
  //         },
  //       },
  //     ]
  //   );
  // };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bienvenue</Text>
          <Text style={styles.appTitle}>Diagnostic Respiratoire</Text>
          <Text style={styles.subtitle}>
            Analysez vos sons respiratoires avec notre IA
          </Text>
        </View>

        {/* Navigation Buttons Row */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={[styles.navButton, styles.profileButton]}
            onPress={navigateToProfile}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonIcon}>👤</Text>
            <Text style={styles.navButtonText}>Profil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, styles.chatsButton]}
            onPress={navigateToPreviousChats}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonIcon}>💬</Text>
            <Text style={styles.navButtonText}>Historique</Text>
          </TouchableOpacity>
          
          {/* <TouchableOpacity 
            style={[styles.navButton, styles.logoutButton]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonIcon}>🚪</Text>
            <Text style={styles.navButtonText}>Déconnexion</Text>
          </TouchableOpacity> */}
        </View>

        {/* Recording Section - Main Feature */}
        <View style={styles.recordingSection}>
          <Text style={styles.sectionTitle}>🎤 Nouvel Enregistrement</Text>
          <View style={styles.recordingContainer}>
            <VoiceRecorder />
          </View>
        </View>

        {/* Quick Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Aperçu Rapide</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Enregistrements</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Analyses</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>-</Text>
              <Text style={styles.statLabel}>Dernier Score</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>⚡ Actions Rapides</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={navigateToPreviousChats}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={styles.quickActionText}>Voir l'Historique</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={navigateToProfile}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionIcon}>⚙️</Text>
              <Text style={styles.quickActionText}>Paramètres</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>💡 Conseils d'Utilisation</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🔇</Text>
              <Text style={styles.tipText}>
                Utilisez l'application dans un environnement calme
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>📱</Text>
              <Text style={styles.tipText}>
                Placez le téléphone près de votre poitrine
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>⏱️</Text>
              <Text style={styles.tipText}>
                Enregistrez pendant 15-30 secondes minimum
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🫁</Text>
              <Text style={styles.tipText}>
                Respirez normalement et profondément
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#95a5a6',
    lineHeight: 22,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileButton: {
    backgroundColor: '#3498db',
  },
  chatsButton: {
    backgroundColor: '#27ae60',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
  },
  navButtonIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  navButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  recordingSection: {
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  recordingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsSection: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  quickActionsSection: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: '#ffffff',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },

  quickActionText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '600',
    textAlign: 'center',
  },
  tipsSection: {
    paddingHorizontal: 20,
  },
  tipsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 30,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
});

export default HomeScreen;