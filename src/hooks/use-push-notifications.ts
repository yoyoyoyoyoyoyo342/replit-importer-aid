import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationData {
  temperature: number;
  condition: string;
  highTemp: number;
  lowTemp: number;
  pollenAlerts: string[];
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Register service worker for push notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          setRegistration(reg);
          console.log('Service Worker registered:', reg);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support push notifications.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notifications enabled",
          description: "You'll receive daily weather and pollen updates at 8 AM.",
        });
        
        // Schedule daily notifications
        scheduleDailyNotifications();
        return true;
      } else {
        toast({
          title: "Notifications blocked",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const scheduleDailyNotifications = () => {
    console.log('Scheduling daily notifications...');
    
    // Clear any existing intervals first
    if ((window as any).weatherNotificationInterval) {
      clearInterval((window as any).weatherNotificationInterval);
    }
    if ((window as any).weatherNotificationTimeout) {
      clearTimeout((window as any).weatherNotificationTimeout);
    }

    // Schedule notification for 8 AM daily
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(8, 0, 0, 0);

    // If it's already past 8 AM today, schedule for tomorrow
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();
    console.log(`Next notification in ${Math.round(timeUntilNotification / (1000 * 60 * 60))} hours`);

    // For testing - also schedule a notification in 1 minute
    const testTimeout = setTimeout(() => {
      console.log('Sending test notification...');
      sendDailyNotification();
    }, 60 * 1000); // 1 minute from now
    
    (window as any).weatherNotificationTimeout = setTimeout(() => {
      console.log('Sending daily notification...');
      sendDailyNotification();
      // Set up recurring daily notifications
      (window as any).weatherNotificationInterval = setInterval(() => {
        console.log('Sending recurring daily notification...');
        sendDailyNotification();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilNotification);

    // Store test timeout for cleanup
    (window as any).weatherTestTimeout = testTimeout;
  };

  const sendDailyNotification = async () => {
    if (permission !== 'granted') return;

    try {
      // Create a basic notification with general weather info
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      
      const notificationBody = `Good morning! Check your weather app for today's forecast and pollen alerts. Time: ${timeString}`;

      if (registration && 'showNotification' in registration) {
        // Use service worker notification for better functionality
        await registration.showNotification('Daily Weather & Pollen Update', {
          body: notificationBody,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'daily-weather',
          requireInteraction: false
        });
      } else {
        // Fallback to basic notification
        new Notification('Daily Weather & Pollen Update', {
          body: notificationBody,
          icon: '/logo.png'
        });
      }
      
      console.log('Daily notification sent successfully');
    } catch (error) {
      console.error('Error sending daily notification:', error);
    }
  };

  const sendTestNotification = async (data: NotificationData) => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }

    const pollenText = data.pollenAlerts.length > 0 
      ? ` High pollen: ${data.pollenAlerts.join(', ')}`
      : '';

    const notificationBody = `${data.condition}, ${data.temperature}°F (H: ${data.highTemp}° L: ${data.lowTemp}°)${pollenText}`;

    try {
      if (registration && 'showNotification' in registration) {
        await registration.showNotification('Test Weather & Pollen Update', {
          body: notificationBody,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'weather-test',
          requireInteraction: false
        });
      } else {
        new Notification('Test Weather & Pollen Update', {
          body: notificationBody,
          icon: '/logo.png'
        });
      }

      toast({
        title: "Test notification sent",
        description: "Check your notifications to see the weather update.",
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Notification failed",
        description: "There was an error sending the test notification.",
        variant: "destructive"
      });
    }
  };

  return {
    permission,
    requestPermission,
    sendTestNotification,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
}