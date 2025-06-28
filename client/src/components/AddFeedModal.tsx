import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const feedSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  title: z.string().optional(),
  tags: z.string().optional(),
});

type FeedFormData = z.infer<typeof feedSchema>;

export function AddFeedModal({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FeedFormData>({
    resolver: zodResolver(feedSchema),
    defaultValues: {
      url: "",
      title: "",
      tags: "",
    },
  });

  const createFeedMutation = useMutation({
    mutationFn: async (data: FeedFormData) => {
      const feedData = {
        url: data.url,
        title: data.title || undefined,
        tags: data.tags ? data.tags.split(",").map(tag => tag.trim()) : [],
      };
      
      await apiRequest("POST", "/api/feeds", feedData);
    },
    onSuccess: () => {
      toast({
        title: "Feed added",
        description: "RSS feed has been successfully added to your collection.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/feeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      
      form.reset();
      onOpenChange(false);
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
        description: error.message || "Failed to add RSS feed. Please check the URL and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FeedFormData) => {
    createFeedMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add RSS Feed</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="url">Feed URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/feed.xml"
              {...form.register("url")}
              className="mt-1"
            />
            {form.formState.errors.url && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.url.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="title">Custom Name (Optional)</Label>
            <Input
              id="title"
              placeholder="My Custom Feed Name"
              {...form.register("title")}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              placeholder="technology, news, startup"
              {...form.register("tags")}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate multiple tags with commas
            </p>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createFeedMutation.isPending}
            >
              {createFeedMutation.isPending ? "Adding..." : "Add Feed"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
