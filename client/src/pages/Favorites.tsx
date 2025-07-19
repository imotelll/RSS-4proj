import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/Sidebar";
import { ArticleCard } from "@/components/ArticleCard";
import { AddFeedModal } from "@/components/AddFeedModal";
import { CreateCollectionModal } from "@/components/CreateCollectionModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ThemeProvider";
import { 
  Search, 
  RefreshCw, 
  Moon, 
  Sun, 
  Plus, 
  Star,
  Menu
} from "lucide-react";

interface Article {
  id: number;
  title: string;
  link: string;
  description: string;
  author?: string;
  publishedAt: string;
  thumbnail?: string;
  feed: {
    title: string;
    id: number;
  };
  userArticle?: {
    read: boolean;
    favorite: boolean;
  };
}

export default function Favorites() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: favoriteArticles = [], isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles/favorites"],
    enabled: !!user,
    retry: false,
  });

  // Mutation pour rafraîchir tous les flux
  const refreshAllMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/feeds/refresh-all");
    },
    onSuccess: (data: any) => {
      toast({
        title: "Feeds refreshed",
        description: `${data.totalNewArticles} new articles from ${data.refreshedFeeds} feeds`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feeds/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to refresh feeds. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Les articles favoris sont déjà filtrés par l'API

  const formatLastUpdateTime = () => {
    const now = new Date();
    return `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
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
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Star className="h-6 w-6 text-yellow-500 fill-current" />
                <h2 className="text-2xl font-bold text-foreground">Mes Favoris</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatLastUpdateTime()}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search favorites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80"
                />
              </div>
              
              {/* Action Buttons */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refreshAllMutation.mutate()}
                disabled={refreshAllMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 ${refreshAllMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              
              <Button onClick={() => setShowAddFeed(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Feed
              </Button>
            </div>
          </div>
        </header>

        {/* Article Feed */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {articlesLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading favorite articles...</div>
              </div>
            ) : favoriteArticles.length === 0 ? (
              <div className="text-center py-16">
                <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <div className="text-lg text-muted-foreground mb-4">No favorite articles yet</div>
                <div className="text-sm text-muted-foreground mb-6">
                  Mark articles as favorites by clicking the star icon on any article
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="text-sm text-muted-foreground">
                    {favoriteArticles.length} favorite article{favoriteArticles.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {favoriteArticles
                  .filter(article => 
                    !searchQuery || 
                    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    article.feed.title.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddFeedModal 
        open={showAddFeed} 
        onOpenChange={setShowAddFeed} 
      />
      
      <CreateCollectionModal 
        open={showCreateCollection} 
        onOpenChange={setShowCreateCollection} 
      />
    </div>
  );
}