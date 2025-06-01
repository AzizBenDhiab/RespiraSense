// types/chat.ts
export interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export interface ChatContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  isTyping: boolean;
  startNewConversation: () => void;
  switchConversation: (id: string) => void;
  sendMessage: (text: string) => Promise<void>;
}

export interface ChatHeaderProps {
  title: string;
  onShowHistory: () => void;
  onNewChat: () => void;
}

export interface MessageBubbleProps {
  message: Message;
}

export interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  onScrollToEnd?: () => void;
}

export interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export interface ConversationHistoryProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  visible: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}
