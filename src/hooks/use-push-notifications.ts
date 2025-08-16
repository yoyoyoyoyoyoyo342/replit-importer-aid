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
    // Schedule notification for 8 AM daily
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(8, 0, 0, 0);

    // If it's already past 8 AM today, schedule for tomorrow
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      sendDailyNotification();
      // Set up recurring daily notifications
      setInterval(sendDailyNotification, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilNotification);
  };

  const sendDailyNotification = async () => {
    if (permission !== 'granted') return;

    try {
      // Fetch current weather data for notification
      const response = await fetch(`${window.location.origin}/api/current-weather`);
      const data: NotificationData = await response.json();

      const pollenText = data.pollenAlerts.length > 0 
        ? ` High pollen: ${data.pollenAlerts.join(', ')}`
        : '';

      const notificationBody = `${data.condition}, ${data.temperature}°F (H: ${data.highTemp}° L: ${data.lowTemp}°)${pollenText}`;

      if (registration && 'showNotification' in registration) {
        // Use service worker notification for better functionality
        await registration.showNotification('Daily Weather & Pollen Update', {
          body: notificationBody,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'daily-weather',
          requireInteraction: true
        });
      } else {
        // Fallback to basic notification
        new Notification('Daily Weather & Pollen Update', {
          body: notificationBody,
          icon: '/favicon.ico'
        });
      }
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

    if (registration && 'showNotification' in registration) {
      await registration.showNotification('Weather & Pollen Update', {
        body: notificationBody,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'weather-update',
        requireInteraction: false
      });
    } else {
      new Notification('Weather & Pollen Update', {
        body: notificationBody,
        icon: '/favicon.ico'
      });
    }

    toast({
      title: "Test notification sent",
      description: "Check your notifications to see the weather update.",
    });
  };

  return {
    permission,
    requestPermission,
    sendTestNotification,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
}