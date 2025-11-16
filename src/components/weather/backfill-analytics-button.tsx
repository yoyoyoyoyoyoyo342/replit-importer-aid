import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from 'lucide-react';

export function BackfillAnalyticsButton() {
  const [loading, setLoading] = useState(false);

  const handleBackfill = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('backfill-analytics', {
        body: { days: 30 },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (error) throw error;

      toast.success(`Successfully backfilled ${data.inserted} analytics events for the past 30 days`);
    } catch (error) {
      console.error('Error backfilling analytics:', error);
      toast.error('Failed to backfill analytics data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleBackfill}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      <Database className="w-4 h-4 mr-2" />
      {loading ? 'Backfilling...' : 'Backfill Historical Data (30 days)'}
    </Button>
  );
}
