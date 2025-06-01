import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface Props {
  onPress: () => void;
}

export const LoginLink: React.FC<Props> = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.linkButton}>
    <Text style={styles.linkText}>
      Don’t have an account? <Text style={styles.bold}>Sign Up</Text>
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  linkButton: { marginTop: 20, alignItems: "center" },
  linkText: { color: "#666" },
  bold: { fontWeight: "bold", color: "#2E86AB" },
});
