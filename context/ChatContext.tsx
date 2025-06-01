// context/ChatContext.tsx - Updated for Expo with your Flask-SocketIO backend
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import {
  ChatMessage,
  WebSocketCallbacks,
  WebSocketService,
} from "../services/WebSocketService";
import { ChatContextType, Conversation, Message } from "../types/chat";

// ✅ Generate truly unique message IDs
const generateUniqueMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
// Function to get the correct WebSocket URL for Expo
const getWebSocketUrl = () => {
  if (__DEV__) {
    if (Platform.OS === "web") {
      return "http://localhost:5000";
    } else {
      // For Expo mobile apps, extract the host from debuggerHost
      const debuggerHost = Constants.expoConfig?.hostUri?.split(":").shift();
      if (debuggerHost) {
        return `http://${debuggerHost}:5000`;
      } else {
        // Fallback: Replace with your computer's actual IP address
        // Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
        return "http://192.168.1.19:5000"; // ⚠️ UPDATE THIS WITH YOUR ACTUAL IP
      }
    }
  }

  // For production
  return "http://your-production-server.com:5000";
};

// WebSocket configuration for medical chatbot
const WS_CONFIG = {
  url: getWebSocketUrl(),
  reconnectInterval: 5000,
  maxReconnectAttempts: 3,
  heartbeatInterval: 30000,
};

// Extended types for medical consultation (matching your backend states)
export interface MedicalConversation extends Conversation {
  consultationStage?:
    | "initial"
    | "disease_selected"
    | "asking_symptoms"
    | "additional_symptoms"
    | "analysis"
    | "completed";
  currentDisease?: string;
  symptomsDiscussed?: string[];
  isAnalyzing?: boolean;
}

interface ExtendedChatContextType extends ChatContextType {
  connectionStatus:
    | "connecting"
    | "connected"
    | "disconnected"
    | "reconnecting";
  reconnect: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearAllConversations: () => Promise<void>;
  // Medical-specific methods
  startMedicalConsultation: () => void;
  currentConsultationStage: string | null;
  isAnalyzing: boolean;
}

const ChatContext = createContext<ExtendedChatContextType | undefined>(
  undefined
);

interface ChatProviderProps {
  children: ReactNode;
  wsUrl?: string;
  userId?: string;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  wsUrl = WS_CONFIG.url,
  userId = "medical_user_" + Date.now(),
}) => {
  const [conversations, setConversations] = useState<MedicalConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentConsultationStage, setCurrentConsultationStage] = useState<
    string | null
  >(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "reconnecting"
  >("disconnected");

  const wsService = useRef<WebSocketService | null>(null);
  const currentUserIdRef = useRef(userId);
  const pendingMessages = useRef<Map<string, Message>>(new Map());
  // Add this useEffect after your existing useEffects
  useEffect(() => {
    if (messages.length > 0 && currentConversationId) {
      // Debounce the persistence to avoid too many calls
      const timeoutId = setTimeout(() => {
        updateCurrentConversation(messages);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages, currentConversationId, currentConsultationStage, isAnalyzing]);
  useEffect(() => {
    console.log(`🔗 Attempting to connect to: ${wsUrl}`);
    console.log(`📱 Platform: ${Platform.OS}`);
    console.log(`🏠 Debug Host: ${Constants.expoConfig?.hostUri}`);

    loadConversations();
    initializeWebSocket();

    return () => {
      if (wsService.current) {
        wsService.current.disconnect();
      }
    };
  }, []);

  const wsCallbacks: WebSocketCallbacks = {
    onConnect: () => {
      console.log("✅ Connected to medical chatbot server");
      setConnectionStatus("connected");

      // Send any pending messages
      pendingMessages.current.forEach((message, messageId) => {
        sendWebSocketMessage(message.text, messageId);
      });
      pendingMessages.current.clear();
    },

    onDisconnect: () => {
      console.log("❌ Disconnected from medical chatbot server");
      setConnectionStatus("disconnected");
      setIsTyping(false);
      setIsAnalyzing(false);
    },

    onError: (error: string) => {
      console.error("🚨 Medical WebSocket error:", error);
      setIsTyping(false);
      setIsAnalyzing(false);

      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `❌ Erreur de connexion: ${error}\n\n🔄 Vérifiez que le serveur médical fonctionne sur ${wsUrl}`,
        isBot: true,
        timestamp: new Date(),
      };
      addBotMessage(errorMessage);
    },

    onReconnecting: () => {
      console.log("🔄 Reconnecting to medical chatbot server...");
      setConnectionStatus("reconnecting");
    },

    onTyping: () => {
      setIsTyping(true);
      // Detect if we're in analysis phase
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage &&
        (lastMessage.text.toLowerCase().includes("analyser") ||
          lastMessage.text.toLowerCase().includes("analyse") ||
          lastMessage.text.toLowerCase().includes("agents médicaux"))
      ) {
        setIsAnalyzing(true);
      }
    },

    onMessage: (data: ChatMessage) => {
      handleWebSocketMessage(data);
    },
  };

  const initializeWebSocket = () => {
    const config = { ...WS_CONFIG, url: wsUrl };
    wsService.current = new WebSocketService(config, wsCallbacks);

    setConnectionStatus("connecting");
    wsService.current.connect().catch((error) => {
      console.error("❌ Failed to connect to medical server:", error);
      setConnectionStatus("disconnected");
    });
  };

  const handleWebSocketMessage = (data: ChatMessage) => {
    console.log("📨 Received WebSocket message:", data);

    switch (data.type) {
      case "bot_response":
        if (data.message && data.messageId) {
          // ✅ Check if message already exists to prevent duplicates
          const messageExists = messages.some(
            (msg) => msg.id === data.messageId
          );
          if (messageExists) {
            console.log(
              `⚠️ Message ${data.messageId} already exists, skipping`
            );
            setIsTyping(false);
            return;
          }

          // Detect consultation stage from bot response
          const stage = detectConsultationStage(data.message);
          setCurrentConsultationStage(stage);

          // Check if analysis is complete
          if (
            data.message.includes("ANALYSE MÉDICALE TERMINÉE") ||
            data.message.includes("CONSEILS ET RECOMMANDATIONS")
          ) {
            setIsAnalyzing(false);
            setCurrentConsultationStage("completed");
          }

          const botMessage: Message = {
            id: data.messageId,
            text: data.message,
            isBot: true,
            timestamp: new Date(data.timestamp || Date.now()),
          };
          addBotMessage(botMessage);
        }
        setIsTyping(false);
        break;

      case "typing":
        setIsTyping(true);
        break;

      case "error":
        console.error("🚨 Medical bot error:", data.message);
        setIsTyping(false);
        setIsAnalyzing(false);

        // ✅ Use unique ID to prevent duplicate error messages
        const errorMessage: Message = {
          id: `error_${Date.now()}_${Math.random()}`,
          text: `⚠️ Erreur médicale: ${
            data.message || "Une erreur médicale est survenue"
          }`,
          isBot: true,
          timestamp: new Date(),
        };
        addBotMessage(errorMessage);
        break;

      case "connection":
        console.log("🔗 Medical connection message:", data.message);
        break;

      default:
        console.log("❓ Unknown medical message type:", data.type, data);
    }
  };

  const detectConsultationStage = (message: string): string => {
    const msgLower = message.toLowerCase();

    if (msgLower.includes("quelle maladie") || msgLower.includes("bonjour")) {
      return "initial";
    } else if (
      msgLower.includes("symptômes courants") ||
      msgLower.includes("avez-vous") ||
      msgLower.includes("répondez par")
    ) {
      return "asking_symptoms";
    } else if (
      msgLower.includes("autres symptômes") ||
      msgLower.includes("décrivez") ||
      msgLower.includes("tapez 'aucun'")
    ) {
      return "additional_symptoms";
    } else if (
      msgLower.includes("analyser") ||
      msgLower.includes("agents médicaux") ||
      msgLower.includes("peut prendre quelques instants")
    ) {
      return "analysis";
    } else if (
      msgLower.includes("analyse médicale terminée") ||
      msgLower.includes("conseils et recommandations")
    ) {
      return "completed";
    }

    return "unknown";
  };

  const sendWebSocketMessage = (text: string, messageId?: string) => {
    if (!wsService.current?.isConnected()) {
      console.warn(
        "⚠️ WebSocket not connected, message will be sent when connection is restored"
      );
      return false;
    }

    const chatMessage: ChatMessage = {
      type: "user_message",
      message: text,
      conversationId: currentConversationId || undefined,
      messageId: messageId || Date.now().toString(),
      userId: currentUserIdRef.current,
    };

    console.log("📤 Sending message:", chatMessage);
    return wsService.current.sendMessage(chatMessage);
  };

  // ✅ Also update addBotMessage to prevent duplicates
  const addBotMessage = (botMessage: Message) => {
    setMessages((prevMessages) => {
      // Check if message already exists
      const messageExists = prevMessages.some(
        (msg) => msg.id === botMessage.id
      );
      if (messageExists) {
        console.log(`⚠️ Bot message ${botMessage.id} already exists, skipping`);
        return prevMessages;
      }

      const updatedMessages = [...prevMessages, botMessage];
      updateCurrentConversation(updatedMessages);
      return updatedMessages;
    });
  };

  const saveConversations = async (
    updatedConversations: MedicalConversation[]
  ) => {
    try {
      await AsyncStorage.setItem(
        "medical_conversations",
        JSON.stringify(updatedConversations)
      );
    } catch (error) {
      console.error("❌ Error saving medical conversations:", error);
    }
  };

  const loadConversations = async () => {
    try {
      const stored = await AsyncStorage.getItem("medical_conversations");
      if (stored) {
        const parsedConversations = JSON.parse(stored).map((conv: any) => ({
          ...conv,
          lastUpdated: new Date(conv.lastUpdated),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setConversations(parsedConversations);

        if (parsedConversations.length > 0) {
          const mostRecent = parsedConversations[0];
          setCurrentConversationId(mostRecent.id);
          setMessages(mostRecent.messages);
          setCurrentConsultationStage(
            mostRecent.consultationStage || "initial"
          );
        } else {
          startMedicalConsultation();
        }
      } else {
        startMedicalConsultation();
      }
    } catch (error) {
      console.error("❌ Error loading medical conversations:", error);
      startMedicalConsultation();
    }
  };

  const generateMedicalTitle = (firstMessage: string): string => {
    const msgLower = firstMessage.toLowerCase();

    // Detect disease mentions
    if (msgLower.includes("bronchite")) return "🫁 Consultation Bronchite";
    if (msgLower.includes("asthme")) return "🫁 Consultation Asthme";
    if (msgLower.includes("pneumonie")) return "🫁 Consultation Pneumonie";
    if (msgLower.includes("grippe")) return "🤒 Consultation Grippe";
    if (msgLower.includes("covid")) return "🦠 Consultation COVID-19";

    // General medical consultation
    if (firstMessage.length <= 30) return `🩺 ${firstMessage}`;
    return `🩺 ${firstMessage.substring(0, 25)}...`;
  };

  const startMedicalConsultation = () => {
    const newConsultation: MedicalConversation = {
      id: Date.now().toString(),
      title: "🩺 Nouvelle Consultation",
      messages: [
        {
          id: "welcome_medical",
          text: "👋 Bonjour ! Je suis votre assistant médical IA.\n\n🔬 Je suis là pour vous aider à analyser vos symptômes liés à différentes maladies respiratoires.  \n D’après l’analyse de votre enregistrement vocal, il se pourrait qu’il s’agisse d’une **pneumonie**.  \n Nous allons maintenant procéder à quelques questions pour vérifier cela.",
          isBot: true,
          timestamp: new Date(),
        },
      ],
      lastUpdated: new Date(),
      consultationStage: "initial",
      isAnalyzing: false,
    };

    const updatedConversations = [newConsultation, ...conversations];
    setConversations(updatedConversations);
    setCurrentConversationId(newConsultation.id);
    setMessages(newConsultation.messages);
    setCurrentConsultationStage("initial");
    setIsAnalyzing(false);
    saveConversations(updatedConversations);
  };

  const startNewConversation = () => {
    startMedicalConsultation();
  };

  const switchConversation = (conversationId: string) => {
    const conversation = conversations.find(
      (conv) => conv.id === conversationId
    );
    if (conversation) {
      setCurrentConversationId(conversationId);
      setMessages(conversation.messages);
      setCurrentConsultationStage(conversation.consultationStage || "initial");
      setIsAnalyzing(conversation.isAnalyzing || false);
      setIsTyping(false);
    }
  };

  const updateCurrentConversation = (newMessages: Message[]) => {
    if (!currentConversationId) return;

    const updatedConversations = conversations.map((conv) => {
      if (conv.id === currentConversationId) {
        let title = conv.title;
        if (title === "🩺 Nouvelle Consultation") {
          const firstUserMessage = newMessages.find((msg) => !msg.isBot);
          if (firstUserMessage) {
            title = generateMedicalTitle(firstUserMessage.text);
          }
        }

        return {
          ...conv,
          title,
          messages: newMessages,
          lastUpdated: new Date(),
          consultationStage: currentConsultationStage as any,
          isAnalyzing,
        };
      }
      return conv;
    });

    updatedConversations.sort(
      (a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()
    );

    setConversations(updatedConversations);
    saveConversations(updatedConversations);
  };

  const deleteConversation = async (conversationId: string) => {
    const updatedConversations = conversations.filter(
      (conv) => conv.id !== conversationId
    );
    setConversations(updatedConversations);
    await saveConversations(updatedConversations);

    if (conversationId === currentConversationId) {
      if (updatedConversations.length > 0) {
        const nextConversation = updatedConversations[0];
        setCurrentConversationId(nextConversation.id);
        setMessages(nextConversation.messages);
        setCurrentConsultationStage(
          nextConversation.consultationStage || "initial"
        );
      } else {
        startMedicalConsultation();
      }
    }
  };

  const clearAllConversations = async () => {
    setConversations([]);
    await AsyncStorage.removeItem("medical_conversations");
    startMedicalConsultation();
  };

  // ✅ Update your sendMessage function to use unique IDs
  const sendMessage = async (inputText: string) => {
    if (inputText.trim() === "") return;

    const userMessage: Message = {
      id: generateUniqueMessageId(), // ✅ Use unique ID generator
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    updateCurrentConversation(updatedMessages);

    // Send via WebSocket
    if (wsService.current?.isConnected()) {
      setIsTyping(true);

      // Check if this might trigger analysis
      const msgLower = inputText.toLowerCase();
      if (
        msgLower.includes("aucun") ||
        msgLower.includes("analyser") ||
        currentConsultationStage === "additional_symptoms"
      ) {
        setIsAnalyzing(true);
      }

      const success = sendWebSocketMessage(inputText.trim(), userMessage.id);

      if (!success) {
        pendingMessages.current.set(userMessage.id, userMessage);
      }
    } else {
      // If not connected, add to pending messages and try to reconnect
      pendingMessages.current.set(userMessage.id, userMessage);

      const offlineMessage: Message = {
        id: generateUniqueMessageId(), // ✅ Use unique ID generator
        text: `🔄 Message sera envoyé quand la connexion sera rétablie...\n\n📍 Serveur: ${wsUrl}\n🔍 Vérifiez que le serveur fonctionne`,
        isBot: true,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, offlineMessage];
      setMessages(finalMessages);
      updateCurrentConversation(finalMessages);

      reconnect();
    }
  };
  const reconnect = () => {
    if (wsService.current && !wsService.current.isConnected()) {
      console.log(`🔄 Attempting reconnection to: ${wsUrl}`);
      setConnectionStatus("connecting");
      wsService.current.connect().catch((error) => {
        console.error("❌ Medical reconnection failed:", error);
        setConnectionStatus("disconnected");
      });
    }
  };

  const value: ExtendedChatContextType = {
    conversations,
    currentConversationId,
    messages,
    isTyping,
    connectionStatus,
    currentConsultationStage,
    isAnalyzing,
    startNewConversation,
    switchConversation,
    sendMessage,
    deleteConversation,
    clearAllConversations,
    reconnect,
    startMedicalConsultation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ExtendedChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
