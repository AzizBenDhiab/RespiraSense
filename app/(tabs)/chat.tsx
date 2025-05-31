// screens/ChatScreen.tsx
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { ChatInput } from "../../components/chat/ChatInput";
import { ConversationHistory } from "../../components/chat/ConversationHistory";
import { MessageList } from "../../components/chat/MessageList";
import { ChatProvider, useChat } from "../../context/ChatContext";

const ChatScreenContent: React.FC = () => {
  const {
    conversations,
    currentConversationId,
    messages,
    isTyping,
    startNewConversation,
    switchConversation,
    sendMessage,
  } = useChat();

  const [inputText, setInputText] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const handleSendMessage = async () => {
    const messageText = inputText.trim();
    if (messageText) {
      setInputText("");
      await sendMessage(messageText);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader
        title="Chat Assistant"
        onShowHistory={() => setShowHistory(true)}
        onNewChat={startNewConversation}
      />

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <MessageList messages={messages} isTyping={isTyping} />

        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSendMessage}
          disabled={isTyping}
        />
      </KeyboardAvoidingView>

      <ConversationHistory
        conversations={conversations}
        currentConversationId={currentConversationId}
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectConversation={switchConversation}
        onNewChat={startNewConversation}
      />
    </SafeAreaView>
  );
};

export default function ChatScreen() {
  return (
    <ChatProvider>
      <ChatScreenContent />
    </ChatProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  chatContainer: {
    flex: 1,
  },
});
