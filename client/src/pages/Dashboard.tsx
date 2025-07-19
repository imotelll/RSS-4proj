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

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
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
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <h2 className="text-xl lg:text-2xl font-bold text-foreground">Dashboard</h2>
              <span className="hidden sm:block text-sm text-muted-foreground">
                {formatLastUpdateTime()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 lg:space-x-4">
              {/* Search Bar - hidden on mobile */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 lg:w-80"
                />
              </div>
              
              {/* Mobile Search Button */}
              <Button variant="ghost" size="sm" className="md:hidden">
                <Search className="h-4 w-4" />
              </Button>
              
              {/* Action Buttons */}
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              
              <Button onClick={() => setShowAddFeed(true)} size="sm">
                <Plus className="mr-1 lg:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Feed</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="bg-card border-b border-border px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 lg:space-x-2 overflow-x-auto">
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
                className="hidden sm:inline-flex"
              >
                This Week
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select defaultValue="date">
                <SelectTrigger className="w-32 lg:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="source">Sort by Source</SelectItem>
                  <SelectItem value="title">Sort by Title</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="ghost" size="sm" className="hidden lg:flex">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Article Feed */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
            {articlesLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading articles...</div>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-lg text-muted-foreground mb-4">No articles yet</div>
                <div className="text-sm text-muted-foreground mb-6">
                  Add some RSS feeds to start reading articles
                </div>
                <Button onClick={() => setShowAddFeed(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Feed
                </Button>
              </div>
            ) : (
              <>
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
                
                {/* Load More Button */}
                <div className="text-center py-8">
                  <Button variant="outline">
                    Load More Articles
                  </Button>
                </div>
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
