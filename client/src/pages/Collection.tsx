import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Settings } from "lucide-react";

interface CollectionData {
  id: number;
  name: string;
  description: string;
  privacy: string;
  members: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
    };
    role: string;
  }>;
  feeds: Array<{
    id: number;
    title: string;
    url: string;
  }>;
}

interface Message {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export default function Collection() {
  const { id } = useParams();
  const { user } = useAuth();
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  const { data: collection } = useQuery<CollectionData>({
    queryKey: ["/api/collections", id],
    enabled: !!id,
  });

  const { 
    isConnected, 
    messages, 
    joinCollection, 
    sendChatMessage 
  } = useWebSocket(user?.id);

  useEffect(() => {
    if (id && isConnected) {
      joinCollection(parseInt(id));
    }
  }, [id, isConnected, joinCollection]);

  useEffect(() => {
    // Handle incoming WebSocket messages
    messages.forEach((message) => {
      if (message.type === "new_message") {
        setChatMessages(prev => [message.message, ...prev]);
      }
    });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendChatMessage(messageInput);
      setMessageInput("");
    }
  };

  if (!collection) {
    return (
      <div className="flex h-screen">
        <Sidebar 
          onAddFeed={() => setShowAddFeed(true)}
          onCreateCollection={() => setShowCreateCollection(true)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading collection...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        onAddFeed={() => setShowAddFeed(true)}
        onCreateCollection={() => setShowCreateCollection(true)}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{collection.name}</h2>
              <p className="text-sm text-muted-foreground">{collection.description}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">{collection.privacy}</Badge>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Manage
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Collection Info */}
            <div className="p-6 border-b border-border">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Members ({collection.members.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {collection.members.map((member) => (
                        <div key={member.user.id} className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.user.profileImageUrl} />
                            <AvatarFallback>
                              {member.user.firstName[0]}{member.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {member.user.firstName} {member.user.lastName}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Feeds ({collection.feeds.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {collection.feeds.map((feed) => (
                        <div key={feed.id} className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-primary rounded-full" />
                          <span className="text-sm">{feed.title}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Articles would go here */}
            <div className="flex-1 p-6">
              <div className="text-center text-muted-foreground">
                Collection articles will be displayed here
              </div>
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="w-80 border-l border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Team Chat</h3>
              <div className="flex items-center space-x-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div key={message.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.user.profileImageUrl} />
                      <AvatarFallback>
                        {message.user.firstName[0]}{message.user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {message.user.firstName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={!isConnected}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
