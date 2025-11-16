import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export function useBroadcastListener() {
  const shownMessagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const dismissedMessages = getDismissedMessages();

    // Load and show existing active messages on mount
    async function loadExistingMessages() {
      const { data: messages } = await supabase
        .from('broadcast_messages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (messages) {
        messages.forEach(message => {
          if (!dismissedMessages.has(message.id) && !shownMessagesRef.current.has(message.id)) {
            shownMessagesRef.current.add(message.id);
            
            toast.info('Admin Announcement', {
              description: message.message,
              duration: Infinity, // Keep open until user dismisses
              position: 'top-center',
              onDismiss: () => markMessageAsDismissed(message.id),
              onAutoClose: () => markMessageAsDismissed(message.id),
            });
          }
        });
      }
    }

    loadExistingMessages();

    // Listen for new messages
    const channel = supabase
      .channel('broadcast-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'broadcast_messages',
        },
        (payload) => {
          const newMessage = payload.new as { id: string; message: string };
          
          // Only show each message once
          if (!dismissedMessages.has(newMessage.id) && !shownMessagesRef.current.has(newMessage.id)) {
            shownMessagesRef.current.add(newMessage.id);
            
            toast.info('Admin Announcement', {
              description: newMessage.message,
              duration: Infinity, // Keep open until user dismisses
              position: 'top-center',
              onDismiss: () => markMessageAsDismissed(newMessage.id),
              onAutoClose: () => markMessageAsDismissed(newMessage.id),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
