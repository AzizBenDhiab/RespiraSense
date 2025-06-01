// components/ConversationHistory.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Conversation, ConversationHistoryProps } from "../../types/chat";

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  conversations,
  currentConversationId,
  visible,
  onClose,
  onSelectConversation,
  onNewChat,
}) => {
  const renderHistoryItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[
        styles.historyItem,
        item.id === currentConversationId && styles.activeHistoryItem,
      ]}
      onPress={() => {
        onSelectConversation(item.id);
        onClose();
      }}
    >
      <Text style={styles.historyTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.historyDate}>
        {item.lastUpdated.toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.historyModal}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyHeaderTitle}>Chat History</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => {
            onNewChat();
            onClose();
          }}
        >
          <Ionicons name="add" size={20} color="#007AFF" />
          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>

        <FlatList
          data={conversations}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          style={styles.historyList}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  historyModal: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  historyHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  newChatText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  historyList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  historyItem: {
    backgroundColor: "#FFF",
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeHistoryItem: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    color: "#666",
  },
});
