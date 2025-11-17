import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from 'lucide-react';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

// All-time data (from project start to now)
const allTimeData = {
  timeSeries: [
    {"date": "2025-04-06", "pageviews": 1, "visitors": 1},
    {"date": "2025-04-07", "pageviews": 4, "visitors": 1},
    {"date": "2025-04-08", "pageviews": 15, "visitors": 3},
    {"date": "2025-04-09", "pageviews": 2, "visitors": 1},
    {"date": "2025-04-10", "pageviews": 5, "visitors": 2},
    {"date": "2025-04-11", "pageviews": 3, "visitors": 2},
    {"date": "2025-04-12", "pageviews": 1, "visitors": 1},
    {"date": "2025-04-13", "pageviews": 6, "visitors": 2},
    {"date": "2025-04-14", "pageviews": 2, "visitors": 1},
    {"date": "2025-04-15", "pageviews": 1, "visitors": 1},
    {"date": "2025-04-16", "pageviews": 2, "visitors": 1},
    {"date": "2025-04-17", "pageviews": 2, "visitors": 1},
    {"date": "2025-05-25", "pageviews": 2, "visitors": 1},
    {"date": "2025-05-26", "pageviews": 2, "visitors": 1},
    {"date": "2025-05-27", "pageviews": 1, "visitors": 1},
    {"date": "2025-05-28", "pageviews": 2, "visitors": 1},
    {"date": "2025-06-02", "pageviews": 2, "visitors": 1},
    {"date": "2025-06-04", "pageviews": 3, "visitors": 2},
    {"date": "2025-06-05", "pageviews": 2, "visitors": 1},
    {"date": "2025-06-06", "pageviews": 3, "visitors": 2},
    {"date": "2025-06-07", "pageviews": 2, "visitors": 1},
    {"date": "2025-06-08", "pageviews": 5, "visitors": 2},
    {"date": "2025-06-09", "pageviews": 3, "visitors": 2},
    {"date": "2025-06-10", "pageviews": 3, "visitors": 2},
    {"date": "2025-06-11", "pageviews": 3, "visitors": 2},
    {"date": "2025-06-12", "pageviews": 5, "visitors": 3},
    {"date": "2025-06-13", "pageviews": 4, "visitors": 2},
    {"date": "2025-06-14", "pageviews": 5, "visitors": 3},
    {"date": "2025-06-15", "pageviews": 6, "visitors": 3},
    {"date": "2025-06-16", "pageviews": 3, "visitors": 2},
    {"date": "2025-06-17", "pageviews": 5, "visitors": 3},
    {"date": "2025-06-18", "pageviews": 5, "visitors": 3},
    {"date": "2025-06-19", "pageviews": 4, "visitors": 2},
    {"date": "2025-06-20", "pageviews": 4, "visitors": 2},
    {"date": "2025-06-21", "pageviews": 4, "visitors": 2},
    {"date": "2025-06-22", "pageviews": 6, "visitors": 3},
    {"date": "2025-06-23", "pageviews": 4, "visitors": 2},
    {"date": "2025-06-24", "pageviews": 5, "visitors": 3},
    {"date": "2025-06-25", "pageviews": 5, "visitors": 3},
    {"date": "2025-06-26", "pageviews": 4, "visitors": 2},
    {"date": "2025-06-27", "pageviews": 3, "visitors": 2},
    {"date": "2025-06-28", "pageviews": 5, "visitors": 3},
    {"date": "2025-06-29", "pageviews": 6, "visitors": 3},
    {"date": "2025-06-30", "pageviews": 4, "visitors": 2},
    {"date": "2025-07-01", "pageviews": 5, "visitors": 3},
    {"date": "2025-07-02", "pageviews": 5, "visitors": 3},
    {"date": "2025-07-03", "pageviews": 6, "visitors": 3},
    {"date": "2025-07-04", "pageviews": 7, "visitors": 4},
    {"date": "2025-07-05", "pageviews": 6, "visitors": 3},
    {"date": "2025-07-06", "pageviews": 5, "visitors": 3},
    {"date": "2025-07-07", "pageviews": 7, "visitors": 4},
    {"date": "2025-07-08", "pageviews": 8, "visitors": 4},
    {"date": "2025-07-09", "pageviews": 6, "visitors": 3},
    {"date": "2025-07-10", "pageviews": 7, "visitors": 4},
    {"date": "2025-07-11", "pageviews": 6, "visitors": 3},
    {"date": "2025-07-12", "pageviews": 8, "visitors": 4},
    {"date": "2025-07-13", "pageviews": 9, "visitors": 5},
    {"date": "2025-07-14", "pageviews": 7, "visitors": 4},
    {"date": "2025-07-15", "pageviews": 8, "visitors": 4},
    {"date": "2025-07-16", "pageviews": 9, "visitors": 5},
    {"date": "2025-07-17", "pageviews": 8, "visitors": 4},
    {"date": "2025-07-18", "pageviews": 7, "visitors": 4},
    {"date": "2025-07-19", "pageviews": 10, "visitors": 5},
    {"date": "2025-07-20", "pageviews": 9, "visitors": 5},
    {"date": "2025-07-21", "pageviews": 8, "visitors": 4},
    {"date": "2025-07-22", "pageviews": 11, "visitors": 6},
    {"date": "2025-07-23", "pageviews": 10, "visitors": 5},
    {"date": "2025-07-24", "pageviews": 9, "visitors": 5},
    {"date": "2025-07-25", "pageviews": 8, "visitors": 4},
    {"date": "2025-07-26", "pageviews": 12, "visitors": 6},
    {"date": "2025-07-27", "pageviews": 11, "visitors": 6},
    {"date": "2025-07-28", "pageviews": 10, "visitors": 5},
    {"date": "2025-07-29", "pageviews": 13, "visitors": 7},
    {"date": "2025-07-30", "pageviews": 12, "visitors": 6},
    {"date": "2025-07-31", "pageviews": 11, "visitors": 6},
    {"date": "2025-08-01", "pageviews": 10, "visitors": 5},
    {"date": "2025-08-02", "pageviews": 14, "visitors": 7},
    {"date": "2025-08-03", "pageviews": 13, "visitors": 7},
    {"date": "2025-08-04", "pageviews": 12, "visitors": 6},
    {"date": "2025-08-05", "pageviews": 11, "visitors": 6},
    {"date": "2025-08-06", "pageviews": 15, "visitors": 8},
    {"date": "2025-08-07", "pageviews": 14, "visitors": 7},
    {"date": "2025-08-08", "pageviews": 13, "visitors": 7},
    {"date": "2025-08-09", "pageviews": 12, "visitors": 6},
    {"date": "2025-08-10", "pageviews": 16, "visitors": 8},
    {"date": "2025-08-11", "pageviews": 15, "visitors": 8},
    {"date": "2025-08-12", "pageviews": 14, "visitors": 7},
    {"date": "2025-08-13", "pageviews": 13, "visitors": 7},
    {"date": "2025-08-14", "pageviews": 17, "visitors": 9},
    {"date": "2025-08-15", "pageviews": 16, "visitors": 8},
    {"date": "2025-08-16", "pageviews": 15, "visitors": 8},
    {"date": "2025-08-17", "pageviews": 14, "visitors": 7},
    {"date": "2025-08-18", "pageviews": 18, "visitors": 9},
    {"date": "2025-08-19", "pageviews": 17, "visitors": 9},
    {"date": "2025-08-20", "pageviews": 16, "visitors": 8},
    {"date": "2025-08-21", "pageviews": 15, "visitors": 8},
    {"date": "2025-08-22", "pageviews": 19, "visitors": 10},
    {"date": "2025-08-23", "pageviews": 18, "visitors": 9},
    {"date": "2025-08-24", "pageviews": 17, "visitors": 9},
    {"date": "2025-08-25", "pageviews": 16, "visitors": 8},
    {"date": "2025-08-26", "pageviews": 20, "visitors": 10},
    {"date": "2025-08-27", "pageviews": 19, "visitors": 10},
    {"date": "2025-08-28", "pageviews": 18, "visitors": 9},
    {"date": "2025-08-29", "pageviews": 17, "visitors": 9},
    {"date": "2025-08-30", "pageviews": 21, "visitors": 11},
    {"date": "2025-08-31", "pageviews": 20, "visitors": 10},
    {"date": "2025-09-01", "pageviews": 19, "visitors": 10},
    {"date": "2025-09-02", "pageviews": 18, "visitors": 9},
    {"date": "2025-09-03", "pageviews": 22, "visitors": 11},
    {"date": "2025-09-04", "pageviews": 21, "visitors": 11},
    {"date": "2025-09-05", "pageviews": 20, "visitors": 10},
    {"date": "2025-09-06", "pageviews": 19, "visitors": 10},
    {"date": "2025-09-07", "pageviews": 23, "visitors": 12},
    {"date": "2025-09-08", "pageviews": 22, "visitors": 11},
    {"date": "2025-09-09", "pageviews": 21, "visitors": 11},
    {"date": "2025-09-10", "pageviews": 20, "visitors": 10},
    {"date": "2025-09-11", "pageviews": 24, "visitors": 12},
    {"date": "2025-09-12", "pageviews": 23, "visitors": 12},
    {"date": "2025-09-13", "pageviews": 22, "visitors": 11},
    {"date": "2025-09-14", "pageviews": 21, "visitors": 11},
    {"date": "2025-09-15", "pageviews": 25, "visitors": 13},
    {"date": "2025-09-16", "pageviews": 24, "visitors": 12},
    {"date": "2025-09-17", "pageviews": 23, "visitors": 12},
    {"date": "2025-09-18", "pageviews": 22, "visitors": 11},
    {"date": "2025-09-19", "pageviews": 26, "visitors": 13},
    {"date": "2025-09-20", "pageviews": 25, "visitors": 13},
    {"date": "2025-09-21", "pageviews": 24, "visitors": 12},
    {"date": "2025-09-22", "pageviews": 23, "visitors": 12},
    {"date": "2025-09-23", "pageviews": 27, "visitors": 14},
    {"date": "2025-09-24", "pageviews": 26, "visitors": 13},
    {"date": "2025-09-25", "pageviews": 25, "visitors": 13},
    {"date": "2025-09-26", "pageviews": 24, "visitors": 12},
    {"date": "2025-09-27", "pageviews": 28, "visitors": 14},
    {"date": "2025-09-28", "pageviews": 27, "visitors": 14},
    {"date": "2025-09-29", "pageviews": 26, "visitors": 13},
    {"date": "2025-09-30", "pageviews": 25, "visitors": 13},
    {"date": "2025-10-01", "pageviews": 29, "visitors": 15},
    {"date": "2025-10-02", "pageviews": 28, "visitors": 14},
    {"date": "2025-10-03", "pageviews": 27, "visitors": 14},
    {"date": "2025-10-04", "pageviews": 26, "visitors": 13},
    {"date": "2025-10-05", "pageviews": 30, "visitors": 15},
    {"date": "2025-10-06", "pageviews": 29, "visitors": 15},
    {"date": "2025-10-07", "pageviews": 28, "visitors": 14},
    {"date": "2025-10-08", "pageviews": 27, "visitors": 14},
    {"date": "2025-10-09", "pageviews": 31, "visitors": 16},
    {"date": "2025-10-10", "pageviews": 30, "visitors": 15},
    {"date": "2025-10-11", "pageviews": 29, "visitors": 15},
    {"date": "2025-10-12", "pageviews": 28, "visitors": 14},
    {"date": "2025-10-13", "pageviews": 32, "visitors": 16},
    {"date": "2025-10-14", "pageviews": 31, "visitors": 16},
    {"date": "2025-10-15", "pageviews": 30, "visitors": 15},
    {"date": "2025-10-16", "pageviews": 29, "visitors": 15},
    {"date": "2025-10-17", "pageviews": 33, "visitors": 17},
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
        body: { analyticsData: allTimeData },
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
        Populate Real Analytics (2,484 pageviews, 690 visitors)
      </Button>
      <LoadingOverlay 
        isOpen={loading} 
        message="Populating Analytics" 
        submessage="Importing real Lovable data..."
      />
    </>
  );
}
