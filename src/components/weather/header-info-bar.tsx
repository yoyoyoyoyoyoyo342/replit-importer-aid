import { useState, useEffect } from "react";
import { Bell, Flame, Trophy, X, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUserStreaks } from "@/hooks/use-user-streaks";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BroadcastMessage {
  id: string;
  message: string;
  created_at: string;
}

const DISMISSED_MESSAGES_KEY = 'dismissed_broadcast_messages';

function getDismissedMessages(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_MESSAGES_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function markMessageAsDismissed(messageId: string) {
  const dismissed = getDismissedMessages();
  dismissed.add(messageId);
  localStorage.setItem(DISMISSED_MESSAGES_KEY, JSON.stringify([...dismissed]));
}

interface HeaderInfoBarProps {
  user: any;
}

export function HeaderInfoBar({ user }: HeaderInfoBarProps) {
  const { streakData, loading: streakLoading } = useUserStreaks();
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDismissedIds(getDismissedMessages());
    
    async function loadMessages() {
      const { data } = await supabase
        .from('broadcast_messages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data) {
        setMessages(data);
      }
    }

    loadMessages();

    // Listen for new messages
    const channel = supabase
      .channel('header-broadcast-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'broadcast_messages',
        },
        (payload) => {
          const newMessage = payload.new as BroadcastMessage;
          setMessages(prev => [newMessage, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDismiss = (id: string) => {
    markMessageAsDismissed(id);
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const unreadMessages = messages.filter(m => !dismissedIds.has(m.id));
  const unreadCount = unreadMessages.length;

  return (
    <div className="flex items-center gap-2">
      {/* Streak Display - Compact */}
      {user && streakData && !streakLoading && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 rounded-full border border-primary/20">
          <Flame className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">{streakData.currentStreak}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">day streak</span>
          <div className="hidden sm:flex items-center gap-1 ml-1 pl-1.5 border-l border-primary/20">
            <Trophy className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{streakData.longestStreak}</span>
          </div>
        </div>
      )}

      {/* Notifications Inbox */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
            <Inbox className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <ScrollArea className="max-h-64">
            {messages.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`p-3 transition-colors ${
                      dismissedIds.has(message.id) ? 'bg-muted/30 opacity-60' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-primary mb-1">Admin Announcement</p>
                        <p className="text-sm text-foreground">{message.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(message.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!dismissedIds.has(message.id) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 shrink-0"
                          onClick={() => handleDismiss(message.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
