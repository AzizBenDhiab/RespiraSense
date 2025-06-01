// services/WebSocketService.ts

import { io, Socket } from "socket.io-client";

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export interface ChatMessage {
  type:
    | "user_message"
    | "bot_response"
    | "typing"
    | "error"
    | "connection"
    | "heartbeat"
    | "analysis_start"
    | "analysis_complete";
  message?: string;
  conversationId?: string;
  timestamp?: string;
  messageId?: string;
  userId?: string;
  // Medical-specific fields
  analysisStage?:
    | "initial"
    | "disease_selected"
    | "asking_symptoms"
    | "additional_symptoms"
    | "analysis";
  progressInfo?: {
    currentSymptom?: string;
    symptomsAsked?: number;
    totalSymptoms?: number;
  };
}

export interface WebSocketCallbacks {
  onMessage: (data: ChatMessage) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onError: (error: string) => void;
  onReconnecting: () => void;
  onTyping: () => void;
  onAnalysisStart?: () => void;
  onAnalysisComplete?: () => void;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private config: Required<WebSocketConfig>;
  private callbacks: WebSocketCallbacks;
  private reconnectAttempts = 0;
  private isManualClose = false;
  private heartbeatTimer: number | null = null;
  private connectionStatus:
    | "connecting"
    | "connected"
    | "disconnected"
    | "reconnecting" = "disconnected";

  constructor(config: WebSocketConfig, callbacks: WebSocketCallbacks) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config,
    };
    this.callbacks = callbacks;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.isManualClose = false;
      this.connectionStatus = "connecting";

      try {
        // Configuration Socket.IO for Flask-SocketIO
        this.socket = io(this.config.url, {
          transports: ["websocket", "polling"],
          upgrade: true,
          autoConnect: true,
          reconnection: false, // We handle reconnection manually
          timeout: 20000,
          forceNew: true,
        });

        this.socket.on("connect", () => {
          console.log("Medical chatbot connected");
          this.connectionStatus = "connected";
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.callbacks.onConnect();
          resolve();
        });

        this.socket.on("bot_response", (data: any) => {
          console.log("Received medical response:", data);
          this.callbacks.onMessage({
            type: "bot_response",
            message: data.message,
            conversationId: data.conversationId,
            timestamp: data.timestamp,
            messageId: data.messageId,
          });
        });

        this.socket.on("typing", () => {
          console.log("Medical bot is analyzing...");
          this.callbacks.onTyping();
          this.callbacks.onMessage({ type: "typing" });
        });

        this.socket.on("error", (data: any) => {
          console.error("Medical chatbot error:", data);
          this.callbacks.onMessage({
            type: "error",
            message: data.message || "Erreur médicale survenue",
          });
        });

        this.socket.on("connection", (data: any) => {
          console.log("Medical connection established:", data.message);
          this.callbacks.onMessage({
            type: "connection",
            message: data.message,
          });
        });

        this.socket.on("heartbeat", () => {
          console.log("Medical server heartbeat received");
        });

        this.socket.on("disconnect", (reason: string) => {
          console.log("Medical chatbot disconnected:", reason);
          this.connectionStatus = "disconnected";
          this.stopHeartbeat();
          this.callbacks.onDisconnect();

          if (
            !this.isManualClose &&
            this.reconnectAttempts < this.config.maxReconnectAttempts
          ) {
            this.scheduleReconnect();
          }
        });

        this.socket.on("connect_error", (error: Error) => {
          console.error("Medical chatbot connection error:", error);
          this.callbacks.onError("Erreur de connexion au serveur médical");
          reject(new Error("Medical chatbot connection failed"));
        });
      } catch (error) {
        console.error("Failed to create medical chatbot connection:", error);
        this.callbacks.onError("Impossible d'établir la connexion médicale");
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus = "disconnected";
  }

  sendMessage(message: ChatMessage): boolean {
    if (this.socket?.connected) {
      try {
        // Send message with the event name expected by Flask-SocketIO
        this.socket.emit("user_message", {
          userId: message.userId,
          message: message.message,
          conversationId: message.conversationId,
          messageId: message.messageId,
          timestamp: new Date().toISOString(),
        });

        console.log("Medical message sent:", message);
        return true;
      } catch (error) {
        console.error("Error sending medical message:", error);
        this.callbacks.onError("Échec de l'envoi du message médical");
        return false;
      }
    } else {
      console.warn("Medical chatbot not connected");
      this.callbacks.onError("Non connecté au serveur médical");
      return false;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    this.connectionStatus = "reconnecting";
    this.callbacks.onReconnecting();

    console.log(
      `Tentative de reconnexion au serveur médical (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (!this.isManualClose) {
        this.connect().catch(() => {
          if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            this.callbacks.onError(
              "Nombre maximum de tentatives de reconnexion atteint"
            );
          }
        });
      }
    }, this.config.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.socket?.emit("heartbeat");
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
