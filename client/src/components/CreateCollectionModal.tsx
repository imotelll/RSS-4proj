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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  description: z.string().optional(),
  privacy: z.enum(["private", "public", "invite_only"]),
  inviteEmails: z.string().optional(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

export function CreateCollectionModal({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      description: "",
      privacy: "private",
      inviteEmails: "",
    },
  });

  const createCollectionMutation = useMutation({
    mutationFn: async (data: CollectionFormData) => {
      const collectionData = {
        name: data.name,
        description: data.description || undefined,
        privacy: data.privacy,
      };
      
      const response = await apiRequest("POST", "/api/collections", collectionData);
      const collection = await response.json();
      
      // TODO: Handle email invitations
      if (data.inviteEmails) {
        const emails = data.inviteEmails.split(",").map(email => email.trim()).filter(Boolean);
        console.log("TODO: Send invitations to:", emails);
      }
      
      return collection;
    },
    onSuccess: () => {
      toast({
        title: "Collection created",
        description: "Your new collection has been successfully created.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      
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
        description: error.message || "Failed to create collection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CollectionFormData) => {
    createCollectionMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Collection</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                placeholder="Design Team Resources"
                {...form.register("name")}
                className="mt-1"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="privacy">Privacy</Label>
              <Select 
                value={form.watch("privacy")} 
                onValueChange={(value: "private" | "public" | "invite_only") => 
                  form.setValue("privacy", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="invite_only">Invite Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A collection of design resources and industry news for our team..."
              rows={3}
              {...form.register("description")}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="inviteEmails">Invite Members</Label>
            <Input
              id="inviteEmails"
              type="email"
              placeholder="colleague@example.com, designer@team.com"
              {...form.register("inviteEmails")}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate multiple emails with commas
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
              disabled={createCollectionMutation.isPending}
            >
              {createCollectionMutation.isPending ? "Creating..." : "Create Collection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
