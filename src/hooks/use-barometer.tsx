import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PressureData {
  pressure: number; // hPa
  timestamp: number;
  trend: "rising" | "falling" | "stable" | null;
}

export function useBarometer() {
  const [pressureData, setPressureData] = useState<PressureData | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [history, setHistory] = useState<{ pressure: number; timestamp: number }[]>([]);

  useEffect(() => {
    // Check if Ambient Pressure Sensor API is supported
    if ('AmbientPressureSensor' in window) {
      setIsSupported(true);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error("Barometer not supported on this device");
      return false;
    }

    try {
      // @ts-ignore - Ambient Pressure Sensor API
      const result = await navigator.permissions.query({ name: 'ambient-light-sensor' });
      
      if (result.state === 'granted' || result.state === 'prompt') {
        setPermissionGranted(true);
        startReading();
        toast.success("Barometer access enabled");
        return true;
      } else {
        toast.error("Permission denied for barometer access");
        return false;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      // Try to start anyway (some browsers don't require explicit permission)
      try {
        startReading();
        setPermissionGranted(true);
        toast.success("Barometer access enabled");
        return true;
      } catch (e) {
        toast.error("Unable to access barometer");
        return false;
      }
    }
  };

  const startReading = () => {
    try {
      // @ts-ignore - Ambient Pressure Sensor API
      const sensor = new AmbientPressureSensor({ frequency: 1 }); // 1 Hz

      sensor.addEventListener('reading', () => {
        const pressure = sensor.pressure; // Pressure in hPa
        const timestamp = Date.now();

        // Add to history (keep last 60 readings = 1 minute at 1Hz)
        setHistory(prev => {
          const newHistory = [...prev, { pressure, timestamp }];
          return newHistory.slice(-60);
        });

        // Calculate trend based on last 30 seconds
        const recentHistory = history.slice(-30);
        let trend: "rising" | "falling" | "stable" | null = null;

        if (recentHistory.length >= 10) {
          const oldPressure = recentHistory[0].pressure;
          const pressureChange = pressure - oldPressure;

          // Rising/falling pressure threshold: 0.5 hPa over 30 seconds
          if (pressureChange > 0.5) {
            trend = "rising";
          } else if (pressureChange < -0.5) {
            trend = "falling";
          } else {
            trend = "stable";
          }
        }

        setPressureData({ pressure, timestamp, trend });
      });

      sensor.addEventListener('error', (event: any) => {
        console.error('Sensor error:', event.error);
        toast.error("Barometer reading failed");
      });

      sensor.start();
    } catch (error) {
      console.error('Failed to start barometer:', error);
      toast.error("Failed to start barometer");
    }
  };

  return {
    pressureData,
    isSupported,
    permissionGranted,
    requestPermission,
  };
}
