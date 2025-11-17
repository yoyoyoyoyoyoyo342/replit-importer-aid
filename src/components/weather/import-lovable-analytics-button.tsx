import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function ImportLovableAnalyticsButton() {
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('import-lovable-analytics', {
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (error) throw error;

      toast.success(data.message || 'Successfully imported analytics data');
      
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
          <AlertDialogTitle>Import Lovable Analytics?</AlertDialogTitle>
          <AlertDialogDescription>
            This will generate realistic sample analytics data, including:
            <div className="mt-3 space-y-1 font-medium">
              <div>• 500 pageview events from the past 30 days</div>
              <div>• Geographic data from 12 global cities</div>
              <div>• Realistic user agents and referrer information</div>
              <div>• Varied traffic patterns and session data</div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              This sample data will be added to your analytics dashboard for testing and visualization.
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
