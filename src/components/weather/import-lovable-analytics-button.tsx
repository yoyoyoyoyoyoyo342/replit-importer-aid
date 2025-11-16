import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ImportLovableAnalyticsButton() {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');

  const handleImport = async () => {
    if (!apiKey || !projectId) {
      toast.error('Please provide both API key and Project ID');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('import-lovable-analytics', {
        body: { 
          lovableApiKey: apiKey,
          projectId: projectId 
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (error) throw error;

      toast.success(`Successfully imported ${data.inserted} events from Lovable analytics`);
      setOpen(false);
      setApiKey('');
      setProjectId('');
      
      // Reload the page to see updated analytics
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error importing analytics:', error);
      toast.error('Failed to import Lovable analytics data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Import Lovable Analytics
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Lovable Analytics History</DialogTitle>
          <DialogDescription>
            Import your historical analytics data from Lovable's analytics system into your custom dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="projectId">Project ID</Label>
            <Input
              id="projectId"
              placeholder="a9a47dbc-22ff-4f61-b164-a9c2474b6f14"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Find this in your project URL
            </p>
          </div>
          <div>
            <Label htmlFor="apiKey">Lovable API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your Lovable API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Generate this in Lovable Settings → API Keys
            </p>
          </div>
          <Button onClick={handleImport} disabled={loading} className="w-full">
            {loading ? 'Importing...' : 'Import Analytics Data'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
