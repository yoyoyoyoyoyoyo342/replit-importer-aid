import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Swords, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";

interface UserResult {
  user_id: string;
  display_name: string;
}

interface UserSearchProps {
  onSelectUser: (userId: string, displayName: string) => void;
  selectedUser: { id: string; name: string } | null;
  onClearSelection: () => void;
}

const searchSchema = z.string().trim().max(100, "Search too long");

export const UserSearch = ({ onSelectUser, selectedUser, onClearSelection }: UserSearchProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      // Validate input
      const validatedQuery = searchSchema.safeParse(searchQuery);
      if (!validatedQuery.success || searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .ilike("display_name", `%${searchQuery}%`)
          .neq("user_id", user?.id || "")
          .not("display_name", "is", null)
          .limit(5);

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error("Error searching users:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, user]);

  const handleSelect = (result: UserResult) => {
    onSelectUser(result.user_id, result.display_name);
    setSearchQuery("");
    setShowResults(false);
  };

  if (selectedUser) {
    return (
      <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
        <Swords className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">Challenging:</p>
          <p className="text-foreground font-semibold">{selectedUser.name}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onClearSelection}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users to challenge..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          className="pl-10 bg-background/60"
        />
      </div>

      {showResults && searchQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="p-3 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No users found
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.user_id}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{result.display_name}</p>
                    <p className="text-xs text-muted-foreground">Click to challenge</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showResults && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};
