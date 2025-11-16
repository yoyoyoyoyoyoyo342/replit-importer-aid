import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useActiveUsers() {
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    const channel = supabase.channel('active-users-presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setActiveUsers(count);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user as present
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return activeUsers;
}
