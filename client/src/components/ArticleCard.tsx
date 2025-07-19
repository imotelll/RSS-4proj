import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Circle, 
  CheckCircle, 
  Star, 
  MessageCircle, 
  Share, 
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

export function ArticleCard({ 
  article, 
  viewMode = "normal" 
}: { 
  article: Article;
  viewMode?: "compact" | "normal" | "expanded";
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRead, setIsRead] = useState(article.userArticle?.read || false);
  const [isFavorite, setIsFavorite] = useState(article.userArticle?.favorite || false);

  const markReadMutation = useMutation({
    mutationFn: async (read: boolean) => {
      await apiRequest("POST", `/api/articles/${article.id}/read`, { read });
    },
    onSuccess: (_, read) => {
      setIsRead(read);
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
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
        description: "Failed to update article status",
        variant: "destructive",
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/articles/${article.id}/favorite`, {});
    },
    onSuccess: () => {
      setIsFavorite(!isFavorite);
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
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
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    },
  });

  const toggleRead = () => {
    markReadMutation.mutate(!isRead);
  };

  const toggleFavorite = () => {
    favoriteMutation.mutate();
  };

  const shareArticle = async () => {
    try {
      await navigator.share({
        title: article.title,
        url: article.link,
      });
    } catch {
      // Fallback to clipboard
      await navigator.clipboard.writeText(article.link);
      toast({
        title: "Link copied",
        description: "Article link copied to clipboard",
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  // Responsive styles based on view mode
  const getCardStyles = () => {
    switch (viewMode) {
      case "compact":
        return "hover:shadow-sm transition-shadow";
      case "expanded":
        return "hover:shadow-lg transition-shadow";
      default:
        return "hover:shadow-md transition-shadow";
    }
  };

  const getPadding = () => {
    switch (viewMode) {
      case "compact":
        return "p-2 sm:p-3";
      case "expanded":
        return "p-4 sm:p-6 lg:p-8";
      default:
        return "p-3 sm:p-4 lg:p-6";
    }
  };

  const getImageSize = () => {
    switch (viewMode) {
      case "compact":
        return "w-12 h-9 sm:w-16 sm:h-12";
      case "expanded":
        return "w-24 h-18 sm:w-32 sm:h-24";
      default:
        return "w-16 h-12 sm:w-20 sm:h-16";
    }
  };

  const getSpacing = () => {
    switch (viewMode) {
      case "compact":
        return "space-y-1 sm:space-y-2";
      case "expanded":
        return "space-y-4 sm:space-y-6";
      default:
        return "space-y-3 sm:space-y-4";
    }
  };

  return (
    <Card className={getCardStyles()}>
      <CardContent className={getPadding()}>
        <div className="flex items-start space-x-3">
          {/* Article Image */}
          {article.thumbnail && (
            <div className="flex-shrink-0">
              <img 
                src={article.thumbnail} 
                alt="Article thumbnail" 
                className={`${getImageSize()} rounded-lg object-cover`}
              />
            </div>
          )}
          
          {/* Article Content */}
          <div className="flex-1 min-w-0">
            <div className={`flex items-center space-x-2 ${viewMode === "compact" ? "mb-1" : "mb-1 sm:mb-2"} flex-wrap`}>
              <div className={`${viewMode === "compact" ? "w-1.5 h-1.5" : "w-2 h-2"} bg-primary rounded-full flex-shrink-0`} />
              <span className={`${viewMode === "compact" ? "text-xs" : "text-xs sm:text-sm"} font-medium text-primary truncate`}>
                {article.feed.title}
              </span>
              <span className={`${viewMode === "compact" ? "text-xs" : "text-xs sm:text-sm"} text-muted-foreground ${viewMode === "compact" ? "hidden md:inline" : "hidden sm:inline"}`}>
                {formatTimeAgo(article.publishedAt)}
              </span>
            </div>
            
            <h3 className={`${
              viewMode === "compact" 
                ? "text-xs sm:text-sm font-medium mb-1 line-clamp-1" 
                : viewMode === "expanded"
                ? "text-base sm:text-lg font-semibold mb-2 sm:mb-3 line-clamp-3"
                : "text-sm sm:text-base font-semibold mb-1 sm:mb-2 line-clamp-2"
            } text-foreground`}>
              {article.title}
            </h3>
            
            {viewMode !== "compact" && (
              <p className={`text-muted-foreground ${
                viewMode === "expanded" 
                  ? "text-sm sm:text-base mb-3 sm:mb-6 line-clamp-4" 
                  : "text-xs sm:text-sm mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-3"
              }`}>
                {article.description}
              </p>
            )}
            
            {/* Action Buttons */}
            <div className={`flex items-center ${viewMode === "compact" ? "justify-end" : "justify-between"}`}>
              {viewMode !== "compact" && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRead}
                    disabled={markReadMutation.isPending}
                    className={`${viewMode === "expanded" ? "h-8 text-sm px-3" : "h-7 text-xs px-2"}`}
                  >
                    {isRead ? (
                      <CheckCircle className={`${viewMode === "expanded" ? "h-4 w-4" : "h-3 w-3"}`} />
                    ) : (
                      <Circle className={`${viewMode === "expanded" ? "h-4 w-4" : "h-3 w-3"}`} />
                    )}
                    <span className={`ml-1 ${viewMode === "expanded" ? "inline" : "hidden sm:inline"}`}>
                      {isRead ? "Read" : "Mark Read"}
                    </span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFavorite}
                    disabled={favoriteMutation.isPending}
                    className={`${viewMode === "expanded" ? "h-8 text-sm px-3" : "h-7 text-xs px-2"}`}
                  >
                    <Star className={`${viewMode === "expanded" ? "h-4 w-4" : "h-3 w-3"} ${isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                    <span className={`ml-1 ${viewMode === "expanded" ? "inline" : "hidden sm:inline"}`}>
                      {isFavorite ? "Favorited" : "Favorite"}
                    </span>
                  </Button>
                </div>
              )}
              
              <div className={`flex items-center ${viewMode === "compact" ? "space-x-1" : "space-x-1"}`}>
                {viewMode === "compact" && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleRead}
                      disabled={markReadMutation.isPending}
                      className="h-6 text-xs px-1"
                    >
                      {isRead ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFavorite}
                      disabled={favoriteMutation.isPending}
                      className="h-6 text-xs px-1"
                    >
                      <Star className={`h-3 w-3 ${isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                    </Button>
                  </>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareArticle}
                  className={`${viewMode === "expanded" ? "h-8 text-sm px-3" : viewMode === "compact" ? "h-6 text-xs px-1" : "h-7 text-xs px-2"}`}
                >
                  <Share className={`${viewMode === "expanded" ? "h-4 w-4" : "h-3 w-3"}`} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className={`${viewMode === "expanded" ? "h-8 text-sm px-3" : viewMode === "compact" ? "h-6 text-xs px-1" : "h-7 text-xs px-2"}`}
                >
                  <a href={article.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className={`${viewMode === "expanded" ? "h-4 w-4" : "h-3 w-3"}`} />
                    <span className={`ml-1 ${viewMode === "expanded" ? "inline" : "hidden sm:inline"}`}>
                      {viewMode === "expanded" ? "Read Full Article" : "Read"}
                    </span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
