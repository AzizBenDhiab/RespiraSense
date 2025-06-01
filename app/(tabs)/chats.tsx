import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const ChatsScreen: React.FC = () => {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  const mockChats = [
    { 
      id: 1, 
      date: '2024-01-15', 
      time: '14:30', 
      status: 'Normal', 
      duration: '25s',
      score: 85 
    },
    { 
      id: 2, 
      date: '2024-01-10', 
      time: '09:15', 
      status: 'À vérifier', 
      duration: '18s',
      score: 65 
    },
    { 
      id: 3, 
      date: '2024-01-05', 
      time: '16:45', 
      status: 'Normal', 
      duration: '32s',
      score: 92 
    },
    { 
      id: 4, 
      date: '2024-01-02', 
      time: '11:20', 
      status: 'Normal', 
      duration: '28s',
      score: 78 
    },
    { 
      id: 5, 
      date: '2023-12-28', 
      time: '19:15', 
      status: 'Attention', 
      duration: '15s',
      score: 45 
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal':
        return { backgroundColor: '#d5f4e6', color: '#27ae60' };
      case 'À vérifier':
        return { backgroundColor: '#fef5e7', color: '#f39c12' };
      case 'Attention':
        return { backgroundColor: '#fadbd8', color: '#e74c3c' };
      default:
        return { backgroundColor: '#ecf0f1', color: '#7f8c8d' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Historique des Analyses</Text>
        </View>

        {/* Stats Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 Résumé</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>5</Text>
              <Text style={styles.summaryLabel}>Enregistrements</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>3</Text>
              <Text style={styles.summaryLabel}>Normaux</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>2</Text>
              <Text style={styles.summaryLabel}>À surveiller</Text>
            </View>
          </View>
          <View style={styles.averageScore}>
            <Text style={styles.averageScoreLabel}>Score moyen</Text>
            <Text style={styles.averageScoreValue}>73/100</Text>
          </View>
        </View>

        {/* Filter Options */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Filtrer par:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity style={[styles.filterButton, styles.activeFilter]}>
              <Text style={[styles.filterButtonText, styles.activeFilterText]}>
                Tous
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterButtonText}>Normal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterButtonText}>À vérifier</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chats List */}
        <View style={styles.chatsContainer}>
          <Text style={styles.sectionTitle}>Enregistrements Récents</Text>
          {mockChats.map((chat) => (
            <TouchableOpacity key={chat.id} style={styles.chatItem}>
              <View style={styles.chatIcon}>
                <Text style={styles.chatIconText}>🎤</Text>
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatDate}>{chat.date} à {chat.time}</Text>
                <Text style={styles.chatDuration}>Durée: {chat.duration}</Text>
                <Text style={styles.chatScore}>Score: {chat.score}/100</Text>
              </View>
              <View style={styles.chatStatus}>
                <Text style={[
                  styles.statusText,
                  getStatusColor(chat.status)
                ]}>
                  {chat.status}
                </Text>
                <Text style={styles.viewDetails}>Voir détails →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Export Options */}
        <View style={styles.exportContainer}>
          <Text style={styles.exportTitle}>📤 Exporter les données</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity style={styles.exportButton}>
              <Text style={styles.exportButtonText}>📊 Rapport PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton}>
              <Text style={styles.exportButtonText}>📋 CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Placeholder Notice */}
        <View style={styles.placeholderNotice}>
          <Text style={styles.placeholderText}>
            🚧 Fonctionnalités d'historique en développement
          </Text>
          <Text style={styles.placeholderSubtext}>
            L'analyse détaillée et l'export seront disponibles prochainement
          </Text>
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
    paddingVertical: 20,
    marginBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  averageScore: {
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  averageScoreLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  averageScoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  filterContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  activeFilter: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  activeFilterText: {
    color: 'white',
  },
  chatsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  chatItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  chatIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  chatIconText: {
    fontSize: 20,
  },
  chatInfo: {
    flex: 1,
  },
  chatDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  chatDuration: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  chatScore: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
  },
  chatStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 5,
  },
  viewDetails: {
    fontSize: 10,
    color: '#bdc3c7',
  },
  exportContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  placeholderNotice: {
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 5,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#6c5400',
  },
});

export default ChatsScreen;