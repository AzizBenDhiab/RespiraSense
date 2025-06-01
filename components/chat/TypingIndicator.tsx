// components/TypingIndicator.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const TypingIndicator: React.FC = () => {
  return (
    <View style={[styles.messageContainer, styles.botMessage]}>
      <View
        style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}
      >
        <Text style={styles.typingText}>Bot is typing...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
  },
  botMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  botBubble: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingBubble: {
    opacity: 0.7,
  },
  typingText: {
    color: "#666",
    fontStyle: "italic",
  },
});
