// components/ChatInput.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { ChatInputProps } from "../../types/chat";

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  disabled = false,
  placeholder = "Type your message...",
}) => {
  const handleSubmit = () => {
    if (value.trim() !== "" && !disabled) {
      onSend();
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        multiline
        maxLength={500}
        onSubmitEditing={handleSubmit}
        blurOnSubmit={false}
        editable={!disabled}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          (value.trim() === "" || disabled) && styles.sendButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={value.trim() === "" || disabled}
      >
        <Ionicons
          name="send"
          size={20}
          color={value.trim() === "" || disabled ? "#999" : "#FFF"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: "#F8F8F8",
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "#007AFF",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
});
