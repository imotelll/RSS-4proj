import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { ArticleCard } from "@/components/ArticleCard";
import { AddFeedModal } from "@/components/AddFeedModal";
import { CreateCollectionModal } from "@/components/CreateCollectionModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/ThemeProvider";
import { 
  Search, 
  RefreshCw, 
  Moon, 
  Sun, 
  Plus, 
  Rss,
  ExternalLink
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

interface Feed {
  id: number;
  title: string;
  url: string;
  description?: string;
  active: boolean;
}

export default function Feed() {
  const { id } = useParams();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Fetch feed details
  const { data: feed, isLoading: feedLoading } = useQuery<Feed>({
    queryKey: [`/api/feeds/${id}`],
    enabled: !!user && !!id,
    retry: false,
  });

  // Fetch articles for this specific feed
  const { data: articles = [], isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: [`/api/feeds/${id}/articles`],
    enabled: !!user && !!id,
    retry: false,
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const formatLastUpdateTime = () => {
    const now = new Date();
    return `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Filter articles based on search query
  const filteredArticles = articles.filter(article => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return article.title.toLowerCase().includes(searchLower) ||
           article.description?.toLowerCase().includes(searchLower) ||
           article.author?.toLowerCase().includes(searchLower);
  });

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

  if (feedLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar 
          onAddFeed={() => setShowAddFeed(true)}
          onCreateCollection={() => setShowCreateCollection(true)}
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading feed...</div>
        </main>
      </div>
    );
  }

  if (!feed) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar 
          onAddFeed={() => setShowAddFeed(true)}
          onCreateCollection={() => setShowCreateCollection(true)}
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-muted-foreground mb-4">Feed not found</div>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </main>
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
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${feed.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                <Rss className="h-6 w-6 text-orange-500" />
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{feed.title}</h2>
                  {feed.description && (
                    <p className="text-sm text-muted-foreground">{feed.description}</p>
                  )}
                </div>
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
                  placeholder="Search in this feed..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80"
                />
              </div>
              
              {/* Action Buttons */}
              <Button variant="ghost" size="sm" asChild>
                <a href={feed.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
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

        {/* Feed Info Bar */}
        <div className="bg-card border-b border-border px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Source: {feed.url}
              </span>
            </div>
            
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Search: {searchQuery}</span>
                <button 
                  onClick={() => setSearchQuery("")}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        </div>

        {/* Article Feed */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {articlesLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading articles...</div>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-16">
                {searchQuery ? (
                  <>
                    <div className="text-lg text-muted-foreground mb-4">No articles found</div>
                    <div className="text-sm text-muted-foreground mb-6">
                      Try adjusting your search criteria
                    </div>
                    <Button onClick={() => setSearchQuery("")}>
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <Rss className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <div className="text-lg text-muted-foreground mb-4">No articles yet</div>
                    <div className="text-sm text-muted-foreground mb-6">
                      This feed hasn't been fetched yet or contains no articles
                    </div>
                    <Button variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Feed
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <>
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
                
                {/* Load More Button */}
                {filteredArticles.length >= 20 && (
                  <div className="text-center py-8">
                    <Button variant="outline">
                      Load More Articles
                    </Button>
                  </div>
                )}
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