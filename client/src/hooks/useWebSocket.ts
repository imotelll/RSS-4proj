import { useState, useEffect, useRef, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(userId?: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Authenticate
        ws.send(JSON.stringify({ type: "auth", userId }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setMessages(prev => [...prev, message]);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        setSocket(null);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          setTimeout(() => {
            console.log(`Reconnection attempt ${reconnectAttempts.current}`);
            connect();
          }, 1000 * reconnectAttempts.current);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      setSocket(ws);
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  }, [userId]);

  useEffect(() => {
    connect();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  const joinCollection = useCallback((collectionId: number) => {
    sendMessage({ type: "join_collection", collectionId });
  }, [sendMessage]);

  const leaveCollection = useCallback(() => {
    sendMessage({ type: "leave_collection" });
  }, [sendMessage]);

  const sendChatMessage = useCallback((content: string) => {
    sendMessage({ type: "send_message", content });
  }, [sendMessage]);

  const sendComment = useCallback((articleId: number, content: string) => {
    sendMessage({ type: "send_comment", articleId, content });
  }, [sendMessage]);

  return {
    socket,
    isConnected,
    messages,
    sendMessage,
    joinCollection,
    leaveCollection,
    sendChatMessage,
    sendComment,
  };
}
