import { useEffect, useState } from 'react';

export type TimeOfDay = 'day' | 'night' | 'sunrise' | 'sunset';

export function useTimeOfDay(sunrise?: string, sunset?: string): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');

  useEffect(() => {
    if (!sunrise || !sunset) return;
    
    const checkTimeOfDay = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      // Parse sunrise/sunset times (format: "HH:MM")
      const parseSunTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const sunriseTime = parseSunTime(sunrise);
      const sunsetTime = parseSunTime(sunset);
      
      // Define golden hour windows (30 minutes before/after sunrise/sunset)
      const sunriseStart = sunriseTime - 30;
      const sunriseEnd = sunriseTime + 30;
      const sunsetStart = sunsetTime - 30;
      const sunsetEnd = sunsetTime + 30;
      
      if (currentTime >= sunriseStart && currentTime <= sunriseEnd) {
        setTimeOfDay('sunrise');
      } else if (currentTime >= sunsetStart && currentTime <= sunsetEnd) {
        setTimeOfDay('sunset');
      } else if (currentTime < sunriseTime || currentTime > sunsetTime) {
        setTimeOfDay('night');
      } else {
        setTimeOfDay('day');
      }
    };

    checkTimeOfDay();
    
    // Check every minute
    const interval = setInterval(checkTimeOfDay, 60000);
    
    return () => clearInterval(interval);
  }, [sunrise, sunset]);

  return timeOfDay;
}
