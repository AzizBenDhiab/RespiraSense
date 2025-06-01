// components/MessageBubble.tsx - Fixed version to prevent duplicate renders
import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { MessageBubbleProps } from "../../types/chat";

export const MessageBubble: React.FC<MessageBubbleProps> = memo(
  ({ message }) => {
    // ✅ Memoize the timestamp formatting to prevent unnecessary re-renders
    const formattedTimestamp = useMemo(() => {
      // Handle both Date objects and strings
      const date =
        message.timestamp instanceof Date
          ? message.timestamp
          : new Date(message.timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid time";
      }

      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }, [message.timestamp]);

    // ✅ Memoize styles to prevent recalculation
    const containerStyle = useMemo(
      () => [
        styles.messageContainer,
        message.isBot ? styles.botMessage : styles.userMessage,
      ],
      [message.isBot]
    );

    const bubbleStyle = useMemo(
      () => [
        styles.messageBubble,
        message.isBot ? styles.botBubble : styles.userBubble,
      ],
      [message.isBot]
    );

    const textStyle = useMemo(
      () => [
        styles.messageText,
        message.isBot ? styles.botText : styles.userText,
      ],
      [message.isBot]
    );

    const timestampStyle = useMemo(
      () => [
        styles.timestamp,
        message.isBot ? styles.botTimestamp : styles.userTimestamp,
      ],
      [message.isBot]
    );
    function preprocessMarkdown(text: string): string {
      return text.replace(/^===\s*(.+?)\s*===/gm, (match, p1) => `## ${p1}`);
    }

    return (
      <View style={containerStyle}>
        <View style={bubbleStyle}>
          <Markdown
            style={{
              body: StyleSheet.flatten(textStyle),
              heading2: {
                fontSize: 18,
                fontWeight: "bold",
                textAlign: "center",
              },
              paragraph: { marginBottom: 0 },
            }}
          >
            {preprocessMarkdown(message.text)}
          </Markdown>

          <Text style={timestampStyle}>{formattedTimestamp}</Text>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // ✅ Custom comparison function to prevent unnecessary re-renders
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.text === nextProps.message.text &&
      prevProps.message.isBot === nextProps.message.isBot &&
      prevProps.message.timestamp.getTime() ===
        nextProps.message.timestamp.getTime()
    );
  }
);

// ✅ Add display name for debugging
MessageBubble.displayName = "MessageBubble";

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
  },
  botMessage: {
    alignItems: "flex-start",
  },
  userMessage: {
    alignItems: "flex-end",
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
  userBubble: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  botText: {
    color: "#333",
  },
  userText: {
    color: "#FFF",
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  botTimestamp: {
    color: "#999",
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
});
