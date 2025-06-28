import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sidebar } from "@/components/Sidebar";
import { ArticleCard } from "@/components/ArticleCard";
import { AddFeedModal } from "@/components/AddFeedModal";
import { CreateCollectionModal } from "@/components/CreateCollectionModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/components/ThemeProvider";
import { 
  Search, 
  RefreshCw, 
  Moon, 
  Sun, 
  Plus, 
  List,
  Filter
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

export default function Articles() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

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

  const { data: articles = [], isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    enabled: !!user,
    retry: false,
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const formatLastUpdateTime = () => {
    const now = new Date();
    return `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Filter and sort articles
  const filteredArticles = articles
    .filter(article => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (!article.title.toLowerCase().includes(searchLower) &&
            !article.description.toLowerCase().includes(searchLower) &&
            !article.feed.title.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filter === "unread" && article.userArticle?.read) return false;
      if (filter === "read" && !article.userArticle?.read) return false;
      if (filter === "favorites" && !article.userArticle?.favorite) return false;
      
      // Date filters
      const articleDate = new Date(article.publishedAt);
      const now = new Date();
      
      if (filter === "today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (articleDate < today) return false;
      }
      
      if (filter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (articleDate < weekAgo) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case "source":
          return a.feed.title.localeCompare(b.feed.title);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
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
                <List className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Tous les articles</h2>
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
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80"
                />
              </div>
              
              {/* Action Buttons */}
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

        {/* Filter Bar */}
        <div className="bg-card border-b border-border px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button 
                variant={filter === "all" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button 
                variant={filter === "unread" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setFilter("unread")}
              >
                Unread
              </Button>
              <Button 
                variant={filter === "read" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setFilter("read")}
              >
                Read
              </Button>
              <Button 
                variant={filter === "favorites" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setFilter("favorites")}
              >
                Favorites
              </Button>
              <Button 
                variant={filter === "today" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setFilter("today")}
              >
                Today
              </Button>
              <Button 
                variant={filter === "week" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setFilter("week")}
              >
                This Week
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="source">Sort by Source</SelectItem>
                  <SelectItem value="title">Sort by Title</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
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
                {searchQuery || filter !== "all" ? (
                  <>
                    <div className="text-lg text-muted-foreground mb-4">No articles found</div>
                    <div className="text-sm text-muted-foreground mb-6">
                      Try adjusting your search or filter criteria
                    </div>
                    <Button onClick={() => { setSearchQuery(""); setFilter("all"); }}>
                      Clear Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-lg text-muted-foreground mb-4">No articles yet</div>
                    <div className="text-sm text-muted-foreground mb-6">
                      Add some RSS feeds to start reading articles
                    </div>
                    <Button onClick={() => setShowAddFeed(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Feed
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredArticles.length} of {articles.length} articles
                  </div>
                  <div className="flex items-center space-x-2">
                    {filter !== "all" && (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <span>Filter: {filter}</span>
                        <button 
                          onClick={() => setFilter("all")}
                          className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
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