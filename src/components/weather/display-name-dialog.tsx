import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

// Validation schema
const displayNameSchema = z.string()
  .trim()
  .min(3, "Display name must be at least 3 characters")
  .max(20, "Display name must be less than 20 characters")
  .regex(/^[a-zA-Z0-9_\- ]+$/, {
    message: "Display name can only contain letters, numbers, spaces, hyphens, and underscores"
  })
  .refine(name => name.replace(/\s/g, '').length >= 3, {
    message: "Display name must contain at least 3 non-space characters"
  });

interface DisplayNameDialogProps {
  open: boolean;
  onClose: (displayName: string | null) => void;
  allowSkip?: boolean;
}

export const DisplayNameDialog = ({ open, onClose, allowSkip = true }: DisplayNameDialogProps) => {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate display name
    try {
      displayNameSchema.parse(displayName);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && allowSkip && onClose(null)}>
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
              3-20 characters (letters, numbers, spaces, hyphens, underscores only)
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading || !displayName.trim()}>
              {loading ? "Setting..." : "Save Name"}
            </Button>
            {allowSkip && (
              <Button type="button" variant="ghost" onClick={() => onClose(null)}>
                Skip for now
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
