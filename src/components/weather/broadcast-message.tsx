import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

export function BroadcastMessage() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  async function sendBroadcast() {
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSending(true);
      
      // Send broadcast message via Realtime channel
      const channel = supabase.channel('admin-broadcasts');
      
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const broadcastResponse = await channel.send({
            type: 'broadcast',
            event: 'admin-message',
            payload: {
              message: message.trim(),
              timestamp: new Date().toISOString(),
            },
          });

          if (broadcastResponse === 'ok') {
            toast({
              title: 'Success',
              description: 'Message broadcasted to all users',
            });
            setMessage('');
          } else {
            throw new Error('Failed to send broadcast');
          }

          // Unsubscribe after sending
          await supabase.removeChannel(channel);
        }
      });

    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast({
        title: 'Error',
        description: 'Failed to send broadcast message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Broadcast Message</CardTitle>
        <CardDescription>Send a notification to all active users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={500}
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {message.length}/500 characters
          </span>
          <Button
            onClick={sendBroadcast}
            disabled={sending || !message.trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : 'Send Broadcast'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
