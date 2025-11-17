import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from 'lucide-react';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

const analyticsData = {
  timeSeries: [
    {"date": "2025-10-18", "pageviews": 50, "visitors": 28},
    {"date": "2025-10-19", "pageviews": 35, "visitors": 15},
    {"date": "2025-10-20", "pageviews": 10, "visitors": 9},
    {"date": "2025-10-21", "pageviews": 22, "visitors": 13},
    {"date": "2025-10-22", "pageviews": 26, "visitors": 13},
    {"date": "2025-10-23", "pageviews": 46, "visitors": 18},
    {"date": "2025-10-24", "pageviews": 23, "visitors": 9},
    {"date": "2025-10-25", "pageviews": 8, "visitors": 8},
    {"date": "2025-10-26", "pageviews": 10, "visitors": 6},
    {"date": "2025-10-27", "pageviews": 12, "visitors": 11},
    {"date": "2025-10-28", "pageviews": 16, "visitors": 13},
    {"date": "2025-10-29", "pageviews": 25, "visitors": 13},
    {"date": "2025-10-30", "pageviews": 7, "visitors": 5},
    {"date": "2025-10-31", "pageviews": 13, "visitors": 8},
    {"date": "2025-11-01", "pageviews": 15, "visitors": 9},
    {"date": "2025-11-02", "pageviews": 4, "visitors": 3},
    {"date": "2025-11-03", "pageviews": 17, "visitors": 13},
    {"date": "2025-11-04", "pageviews": 12, "visitors": 9},
    {"date": "2025-11-05", "pageviews": 21, "visitors": 15},
    {"date": "2025-11-06", "pageviews": 21, "visitors": 18},
    {"date": "2025-11-07", "pageviews": 13, "visitors": 11},
    {"date": "2025-11-08", "pageviews": 6, "visitors": 5},
    {"date": "2025-11-09", "pageviews": 5, "visitors": 4},
    {"date": "2025-11-10", "pageviews": 5, "visitors": 5},
    {"date": "2025-11-11", "pageviews": 2, "visitors": 2},
    {"date": "2025-11-12", "pageviews": 11, "visitors": 10},
    {"date": "2025-11-13", "pageviews": 2, "visitors": 2},
    {"date": "2025-11-14", "pageviews": 3, "visitors": 3},
    {"date": "2025-11-15", "pageviews": 10, "visitors": 5},
    {"date": "2025-11-16", "pageviews": 74, "visitors": 12},
    {"date": "2025-11-17", "pageviews": 26, "visitors": 6}
  ]
};

export function PopulateRealAnalyticsButton() {
  const [loading, setLoading] = useState(false);

  const handlePopulate = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('populate-analytics', {
        body: { analyticsData },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (error) throw error;

      toast.success(data.message || 'Successfully populated real analytics data');
      
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error populating analytics:', error);
      toast.error('Failed to populate analytics data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="default" 
        size="sm" 
        onClick={handlePopulate}
        disabled={loading}
      >
        <Database className="w-4 h-4 mr-2" />
        Populate Real Analytics (550 pageviews, 301 visitors)
      </Button>
      <LoadingOverlay 
        isOpen={loading} 
        message="Populating Analytics" 
        submessage="Importing real Lovable data..."
      />
    </>
  );
}
