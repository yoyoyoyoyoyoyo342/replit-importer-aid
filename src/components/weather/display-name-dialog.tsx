import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DisplayNameDialogProps {
  open: boolean;
  onClose: (displayName: string | null) => void;
}

export const DisplayNameDialog = ({ open, onClose }: DisplayNameDialogProps) => {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }

    if (displayName.length < 3 || displayName.length > 20) {
      toast.error("Display name must be 3-20 characters");
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Display name set! Welcome to the leaderboard!");
      onClose(displayName);
    } catch (error) {
      toast.error("Failed to set display name");
      console.error("Error setting display name:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Your Display Name</DialogTitle>
          <DialogDescription>
            Choose a display name to appear on the leaderboard. This will be visible to all users.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              3-20 characters
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Setting..." : "Continue to Leaderboard"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
