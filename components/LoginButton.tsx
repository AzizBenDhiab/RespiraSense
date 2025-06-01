import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface Props {
  onPress: () => void;
  loading: boolean;
}

export const LoginButton: React.FC<Props> = ({ onPress, loading }) => (
  <TouchableOpacity
    style={[styles.button, loading && styles.disabled]}
    onPress={onPress}
    disabled={loading}
  >
    <Text style={styles.buttonText}>
      {loading ? "Signing In..." : "Sign In"}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2E86AB",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
