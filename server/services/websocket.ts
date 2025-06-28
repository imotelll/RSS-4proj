import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { storage } from "../storage";

interface WSClient {
  ws: WebSocket;
  userId?: string;
  collectionId?: number;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, WSClient> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection');
      
      const client: WSClient = { ws };
      this.clients.set(ws, client);

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (message.type) {
      case 'auth':
        client.userId = message.userId;
        this.sendMessage(ws, { type: 'auth', success: true });
        break;

      case 'join_collection':
        client.collectionId = message.collectionId;
        this.sendMessage(ws, { 
          type: 'joined_collection', 
          collectionId: message.collectionId 
        });
        break;

      case 'leave_collection':
        client.collectionId = undefined;
        this.sendMessage(ws, { type: 'left_collection' });
        break;

      case 'send_message':
        if (client.userId && client.collectionId) {
          const newMessage = await storage.createMessage({
            collectionId: client.collectionId,
            userId: client.userId,
            content: message.content,
          });

          const user = await storage.getUser(client.userId);
          
          this.broadcastToCollection(client.collectionId, {
            type: 'new_message',
            message: {
              ...newMessage,
              user,
            },
          });
        }
        break;

      case 'send_comment':
        if (client.userId && message.articleId) {
          const comment = await storage.createComment({
            articleId: message.articleId,
            userId: client.userId,
            collectionId: client.collectionId,
            content: message.content,
          });

          const user = await storage.getUser(client.userId);

          // Broadcast to all clients (or specific collection if specified)
          this.broadcast({
            type: 'new_comment',
            comment: {
              ...comment,
              user,
            },
          });
        }
        break;

      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private sendMessage(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.sendMessage(ws, { type: 'error', error });
  }

  private broadcast(message: any) {
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  private broadcastToCollection(collectionId: number, message: any) {
    this.clients.forEach((client) => {
      if (client.collectionId === collectionId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  // Public method to broadcast article updates
  broadcastArticleUpdate(articleId: number, update: any) {
    this.broadcast({
      type: 'article_update',
      articleId,
      update,
    });
  }
}
