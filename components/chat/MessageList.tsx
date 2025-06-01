// components/MessageList.tsx
import React, { useEffect, useRef } from "react";
import { FlatList, StyleSheet } from "react-native";
import { MessageListProps } from "../../types/chat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  onScrollToEnd,
}) => {
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
        onScrollToEnd?.();
      }, 100);
    }
  }, [messages, onScrollToEnd]);

  const renderMessage = ({ item }: { item: any }) => (
    <MessageBubble message={item} />
  );

  const renderFooter = () => {
    return isTyping ? <TypingIndicator /> : null;
  };

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item.id}
      style={styles.messagesList}
      contentContainerStyle={styles.messagesContainer}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={renderFooter}
    />
  );
};

const styles = StyleSheet.create({
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
