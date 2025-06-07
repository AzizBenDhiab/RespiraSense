// import { useRouter } from 'expo-router';
// import React from 'react';
// import {
//     SafeAreaView,
//     ScrollView,
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     View,
// } from 'react-native';

// const ProfileScreen: React.FC = () => {
//   const router = useRouter();

//   const goBack = () => {
//     router.back();
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity style={styles.backButton} onPress={goBack}>
//             <Text style={styles.backButtonText}>← Retour</Text>
//           </TouchableOpacity>
//           <Text style={styles.title}>Mon Profil</Text>
//         </View>

//         {/* Profile Card */}
//         <View style={styles.profileCard}>
//           <View style={styles.avatarContainer}>
//             <Text style={styles.avatar}>👤</Text>
//           </View>
//           <Text style={styles.userName}>Utilisateur Test</Text>
//           <Text style={styles.userEmail}>test@example.com</Text>
//         </View>

//         {/* Profile Options */}
//         <View style={styles.optionsContainer}>
//           <TouchableOpacity style={styles.optionItem}>
//             <Text style={styles.optionIcon}>📊</Text>
//             <Text style={styles.optionText}>Mes Statistiques</Text>
//             <Text style={styles.optionArrow}>→</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.optionItem}>
//             <Text style={styles.optionIcon}>🔔</Text>
//             <Text style={styles.optionText}>Notifications</Text>
//             <Text style={styles.optionArrow}>→</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.optionItem}>
//             <Text style={styles.optionIcon}>🔒</Text>
//             <Text style={styles.optionText}>Confidentialité</Text>
//             <Text style={styles.optionArrow}>→</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.optionItem}>
//             <Text style={styles.optionIcon}>⚙️</Text>
//             <Text style={styles.optionText}>Paramètres</Text>
//             <Text style={styles.optionArrow}>→</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.optionItem}>
//             <Text style={styles.optionIcon}>ℹ️</Text>
//             <Text style={styles.optionText}>À propos</Text>
//             <Text style={styles.optionArrow}>→</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Account Actions */}
//         <View style={styles.actionsContainer}>
//           <TouchableOpacity style={styles.actionButton}>
//             <Text style={styles.actionButtonText}>Modifier le profil</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={[styles.actionButton, styles.dangerButton]}>
//             <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
//               Supprimer le compte
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {/* Placeholder Notice */}
//         <View style={styles.placeholderNotice}>
//           <Text style={styles.placeholderText}>
//             🚧 Écran de profil en développement
//           </Text>
//           <Text style={styles.placeholderSubtext}>
//             Cette page sera complétée par l'équipe prochainement
//           </Text>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   scrollContainer: {
//     paddingBottom: 30,
//   },
//   header: {
//     backgroundColor: '#ffffff',
//     paddingHorizontal: 20,
//     paddingVertical: 20,
//     marginBottom: 20,
//     borderBottomLeftRadius: 25,
//     borderBottomRightRadius: 25,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   backButton: {
//     marginBottom: 10,
//   },
//   backButtonText: {
//     fontSize: 16,
//     color: '#3498db',
//     fontWeight: '600',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//   },
//   profileCard: {
//     backgroundColor: '#ffffff',
//     marginHorizontal: 20,
//     marginBottom: 20,
//     borderRadius: 15,
//     padding: 30,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   avatarContainer: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#ecf0f1',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   avatar: {
//     fontSize: 40,
//   },
//   userName: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 5,
//   },
//   userEmail: {
//     fontSize: 14,
//     color: '#7f8c8d',
//   },
//   optionsContainer: {
//     backgroundColor: '#ffffff',
//     marginHorizontal: 20,
//     marginBottom: 20,
//     borderRadius: 15,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   optionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ecf0f1',
//   },
//   optionIcon: {
//     fontSize: 20,
//     marginRight: 15,
//     width: 30,
//   },
//   optionText: {
//     flex: 1,
//     fontSize: 16,
//     color: '#2c3e50',
//   },
//   optionArrow: {
//     fontSize: 16,
//     color: '#bdc3c7',
//   },
//   actionsContainer: {
//     marginHorizontal: 20,
//     marginBottom: 20,
//   },
//   actionButton: {
//     backgroundColor: '#3498db',
//     borderRadius: 10,
//     paddingVertical: 15,
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   actionButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   dangerButton: {
//     backgroundColor: '#e74c3c',
//   },
//   dangerButtonText: {
//     color: 'white',
//   },
//   placeholderNotice: {
//     backgroundColor: '#fff3cd',
//     borderRadius: 10,
//     padding: 15,
//     marginHorizontal: 20,
//     borderLeftWidth: 4,
//     borderLeftColor: '#ffc107',
//   },
//   placeholderText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#856404',
//     marginBottom: 5,
//   },
//   placeholderSubtext: {
//     fontSize: 14,
//     color: '#6c5400',
//   },
// });

// export default ProfileScreen;
