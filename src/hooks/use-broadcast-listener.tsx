import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useBroadcastListener() {
  const shownMessagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
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
          if (!shownMessagesRef.current.has(newMessage.id)) {
            shownMessagesRef.current.add(newMessage.id);
            
            toast.info('Admin Announcement', {
              description: newMessage.message,
              duration: 10000,
              position: 'top-center',
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
