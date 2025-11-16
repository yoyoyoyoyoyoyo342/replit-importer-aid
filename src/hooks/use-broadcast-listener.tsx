import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useBroadcastListener() {
  useEffect(() => {
    const channel = supabase
      .channel('admin-broadcasts')
      .on('broadcast', { event: 'admin-message' }, (payload) => {
        const { message } = payload.payload;
        
        // Show toast notification with the admin message
        toast.info('Admin Announcement', {
          description: message,
          duration: 10000, // Show for 10 seconds
          position: 'top-center',
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
