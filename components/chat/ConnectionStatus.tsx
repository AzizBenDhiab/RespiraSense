// components/ConnectionStatus.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ConnectionStatusProps {
  status: "connecting" | "connected" | "disconnected" | "reconnecting";
  onReconnect?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  onReconnect,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          text: "Connected",
          color: "#4CAF50",
          icon: "checkmark-circle" as const,
          showReconnect: false,
        };
      case "connecting":
        return {
          text: "Connecting...",
          color: "#FF9800",
          icon: "time" as const,
          showReconnect: false,
        };
      case "reconnecting":
        return {
          text: "Reconnecting...",
          color: "#FF9800",
          icon: "refresh" as const,
          showReconnect: false,
        };
      case "disconnected":
        return {
          text: "Disconnected",
          color: "#F44336",
          icon: "close-circle" as const,
          showReconnect: true,
        };
      default:
        return {
          text: "Unknown",
          color: "#999",
          icon: "help-circle" as const,
          showReconnect: false,
        };
    }
  };

  const config = getStatusConfig();

  if (status === "connected") {
    return null; // Don't show anything when connected
  }

  return (
    <View style={[styles.container, { backgroundColor: config.color }]}>
      <View style={styles.content}>
        <Ionicons name={config.icon} size={16} color="white" />
        <Text style={styles.text}>{config.text}</Text>
        {config.showReconnect && onReconnect && (
          <TouchableOpacity
            onPress={onReconnect}
            style={styles.reconnectButton}
          >
            <Text style={styles.reconnectText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  reconnectButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
  },
  reconnectText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
