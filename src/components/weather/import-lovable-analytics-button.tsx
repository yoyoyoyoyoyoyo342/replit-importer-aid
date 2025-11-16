import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Historical Lovable analytics data (Aug-Nov 2025)
const HISTORICAL_DATA = [
  { date: '2025-08-10', visitors: 6, pageviews: 15 },
  { date: '2025-08-11', visitors: 13, pageviews: 19 },
  { date: '2025-08-12', visitors: 1, pageviews: 1 },
  { date: '2025-08-13', visitors: 4, pageviews: 4 },
  { date: '2025-08-14', visitors: 2, pageviews: 4 },
  { date: '2025-08-15', visitors: 3, pageviews: 6 },
  { date: '2025-08-16', visitors: 20, pageviews: 48 },
  { date: '2025-08-17', visitors: 7, pageviews: 18 },
  { date: '2025-08-18', visitors: 19, pageviews: 40 },
  { date: '2025-08-19', visitors: 14, pageviews: 20 },
  { date: '2025-08-20', visitors: 12, pageviews: 12 },
  { date: '2025-08-21', visitors: 13, pageviews: 51 },
  { date: '2025-08-22', visitors: 17, pageviews: 34 },
  { date: '2025-08-27', visitors: 1, pageviews: 1 },
  { date: '2025-08-28', visitors: 2, pageviews: 2 },
  { date: '2025-08-29', visitors: 3, pageviews: 3 },
  { date: '2025-09-01', visitors: 6, pageviews: 6 },
  { date: '2025-09-02', visitors: 2, pageviews: 2 },
  { date: '2025-09-03', visitors: 4, pageviews: 4 },
  { date: '2025-09-05', visitors: 12, pageviews: 12 },
  { date: '2025-09-06', visitors: 3, pageviews: 3 },
  { date: '2025-09-07', visitors: 8, pageviews: 10 },
  { date: '2025-09-08', visitors: 5, pageviews: 5 },
  { date: '2025-09-09', visitors: 2, pageviews: 2 },
  { date: '2025-09-10', visitors: 2, pageviews: 2 },
  { date: '2025-09-11', visitors: 3, pageviews: 3 },
  { date: '2025-09-12', visitors: 2, pageviews: 2 },
  { date: '2025-09-13', visitors: 4, pageviews: 4 },
  { date: '2025-09-14', visitors: 5, pageviews: 11 },
  { date: '2025-09-15', visitors: 6, pageviews: 18 },
  { date: '2025-09-16', visitors: 3, pageviews: 3 },
  { date: '2025-09-17', visitors: 5, pageviews: 9 },
  { date: '2025-09-18', visitors: 1, pageviews: 1 },
  { date: '2025-09-19', visitors: 2, pageviews: 3 },
  { date: '2025-09-20', visitors: 8, pageviews: 16 },
  { date: '2025-09-21', visitors: 3, pageviews: 7 },
  { date: '2025-09-22', visitors: 7, pageviews: 14 },
  { date: '2025-09-23', visitors: 7, pageviews: 7 },
  { date: '2025-09-24', visitors: 12, pageviews: 13 },
  { date: '2025-09-25', visitors: 8, pageviews: 9 },
  { date: '2025-09-26', visitors: 8, pageviews: 11 },
  { date: '2025-09-27', visitors: 5, pageviews: 8 },
  { date: '2025-09-28', visitors: 4, pageviews: 5 },
  { date: '2025-09-29', visitors: 2, pageviews: 3 },
  { date: '2025-10-01', visitors: 6, pageviews: 10 },
  { date: '2025-10-02', visitors: 9, pageviews: 11 },
  { date: '2025-10-03', visitors: 12, pageviews: 20 },
  { date: '2025-10-04', visitors: 17, pageviews: 31 },
  { date: '2025-10-05', visitors: 13, pageviews: 26 },
  { date: '2025-10-06', visitors: 4, pageviews: 9 },
  { date: '2025-10-07', visitors: 6, pageviews: 9 },
  { date: '2025-10-08', visitors: 2, pageviews: 8 },
  { date: '2025-10-09', visitors: 3, pageviews: 8 },
  { date: '2025-10-10', visitors: 5, pageviews: 12 },
  { date: '2025-10-11', visitors: 1, pageviews: 4 },
  { date: '2025-10-12', visitors: 7, pageviews: 22 },
  { date: '2025-10-13', visitors: 4, pageviews: 24 },
  { date: '2025-10-14', visitors: 2, pageviews: 8 },
  { date: '2025-10-15', visitors: 14, pageviews: 21 },
  { date: '2025-10-16', visitors: 2, pageviews: 3 },
  { date: '2025-10-17', visitors: 6, pageviews: 18 },
  { date: '2025-10-18', visitors: 28, pageviews: 50 },
  { date: '2025-10-19', visitors: 15, pageviews: 35 },
  { date: '2025-10-20', visitors: 9, pageviews: 10 },
  { date: '2025-10-21', visitors: 13, pageviews: 22 },
  { date: '2025-10-22', visitors: 13, pageviews: 26 },
  { date: '2025-10-23', visitors: 18, pageviews: 46 },
  { date: '2025-10-24', visitors: 9, pageviews: 23 },
  { date: '2025-10-25', visitors: 8, pageviews: 8 },
  { date: '2025-10-26', visitors: 6, pageviews: 10 },
  { date: '2025-10-27', visitors: 11, pageviews: 12 },
  { date: '2025-10-28', visitors: 13, pageviews: 16 },
  { date: '2025-10-29', visitors: 13, pageviews: 25 },
  { date: '2025-10-30', visitors: 5, pageviews: 10 },
  { date: '2025-10-31', visitors: 8, pageviews: 17 },
  { date: '2025-11-01', visitors: 9, pageviews: 22 },
  { date: '2025-11-02', visitors: 3, pageviews: 5 },
  { date: '2025-11-03', visitors: 13, pageviews: 21 },
  { date: '2025-11-04', visitors: 9, pageviews: 10 },
  { date: '2025-11-05', visitors: 15, pageviews: 29 },
  { date: '2025-11-06', visitors: 18, pageviews: 30 },
  { date: '2025-11-07', visitors: 11, pageviews: 21 },
  { date: '2025-11-08', visitors: 5, pageviews: 7 },
  { date: '2025-11-09', visitors: 4, pageviews: 5 },
  { date: '2025-11-10', visitors: 5, pageviews: 8 },
  { date: '2025-11-11', visitors: 2, pageviews: 2 },
  { date: '2025-11-12', visitors: 10, pageviews: 14 },
  { date: '2025-11-13', visitors: 2, pageviews: 2 },
  { date: '2025-11-14', visitors: 3, pageviews: 4 },
  { date: '2025-11-15', visitors: 5, pageviews: 10 },
];

function generateAnalyticsEvents() {
  const events = [];
  
  for (const day of HISTORICAL_DATA) {
    const date = new Date(day.date);
    const { visitors, pageviews } = day;
    
    // Generate events for each visitor
    for (let i = 0; i < visitors; i++) {
      const sessionId = crypto.randomUUID();
      const pagesPerVisitor = Math.ceil(pageviews / visitors);
      
      // Create pageview events for this visitor
      for (let j = 0; j < pagesPerVisitor; j++) {
        const eventDate = new Date(date);
        eventDate.setHours(Math.floor(Math.random() * 24));
        eventDate.setMinutes(Math.floor(Math.random() * 60));
        eventDate.setSeconds(Math.floor(Math.random() * 60));
        
        events.push({
          event_type: 'pageview',
          page_path: '/',
          session_id: sessionId,
          created_at: eventDate.toISOString(),
        });
      }
    }
  }
  
  return events;
}

export function ImportLovableAnalyticsButton() {
  const [loading, setLoading] = useState(false);

  const totalVisitors = HISTORICAL_DATA.reduce((sum, d) => sum + d.visitors, 0);
  const totalPageviews = HISTORICAL_DATA.reduce((sum, d) => sum + d.pageviews, 0);

  const handleImport = async () => {
    setLoading(true);
    try {
      const analyticsData = generateAnalyticsEvents();
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('import-lovable-analytics', {
        body: { analyticsData },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (error) throw error;

      toast.success(`Successfully imported ${totalPageviews} pageviews from ${totalVisitors} visitors`);
      
      // Reload the page to see updated analytics
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error importing analytics:', error);
      toast.error('Failed to import analytics data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Import Lovable Analytics
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Import Historical Analytics?</AlertDialogTitle>
          <AlertDialogDescription>
            This will import your Lovable analytics history from August-November 2025:
            <div className="mt-3 space-y-1 font-medium">
              <div>• {totalVisitors} unique visitors</div>
              <div>• {totalPageviews} total pageviews</div>
              <div>• 4 months of historical data</div>
            </div>
            <div className="mt-3 text-muted-foreground">
              This process may take a minute to complete.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleImport} disabled={loading}>
            {loading ? 'Importing...' : 'Import Now'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
