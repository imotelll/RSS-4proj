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

export function ArticleCard({ article }: { article: Article }) {
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Article Image */}
          {article.thumbnail && (
            <div className="flex-shrink-0">
              <img 
                src={article.thumbnail} 
                alt="Article thumbnail" 
                className="w-20 h-16 rounded-lg object-cover"
              />
            </div>
          )}
          
          {/* Article Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span className="text-sm font-medium text-primary">
                {article.feed.title}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatTimeAgo(article.publishedAt)}
              </span>
              <Badge variant="secondary" className="text-xs">
                Technology
              </Badge>
            </div>
            
            <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
              {article.title}
            </h3>
            
            <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
              {article.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleRead}
                  disabled={markReadMutation.isPending}
                  className={isRead ? "text-primary" : "text-muted-foreground"}
                >
                  {isRead ? (
                    <CheckCircle className="mr-1 h-4 w-4" />
                  ) : (
                    <Circle className="mr-1 h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {isRead ? "Read" : "Mark as read"}
                  </span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFavorite}
                  disabled={favoriteMutation.isPending}
                  className={isFavorite ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}
                >
                  <Star className={`mr-1 h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                  <span className="text-sm">
                    {isFavorite ? "Favorited" : "Favorite"}
                  </span>
                </Button>
                
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-500">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  <span className="text-sm">3</span>
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareArticle}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Share className="h-4 w-4" />
                </Button>
                
                <Button asChild size="sm">
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    Read More
                    <ExternalLink className="ml-1 h-3 w-3" />
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
