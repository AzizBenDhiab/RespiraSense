// app/(tabs)/dashboard.tsx
import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const DashboardScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.welcomeContainer}>
          <Ionicons name="medical" size={80} color="#2E86AB" />
          <Text style={styles.welcomeTitle}>Welcome to RespiraSense!</Text>
          <Text style={styles.welcomeSubtitle}>
            Your respiratory health journey starts here
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeContainer: {
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
});
