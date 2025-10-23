/**
 * Converts a time string from 12-hour format to 24-hour format or vice versa
 * @param timeString - Time in format "HH:MM AM/PM" or "HH:MM"
 * @param to24Hour - Whether to convert to 24-hour format (true) or 12-hour format (false)
 * @returns Formatted time string
 */
export function formatTime(timeString: string | undefined, to24Hour: boolean): string {
  if (!timeString || timeString === '—') return '—';
  
  try {
    // Check if already in desired format
    const is24HourFormat = !timeString.match(/AM|PM|am|pm/i);
    
    if (to24Hour && is24HourFormat) {
      // Already in 24-hour format
      return timeString;
    }
    
    if (!to24Hour && !is24HourFormat) {
      // Already in 12-hour format
      return timeString;
    }
    
    if (to24Hour) {
      // Convert from 12-hour to 24-hour
      const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i);
      if (!match) return timeString;
      
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    } else {
      // Convert from 24-hour to 12-hour
      const match = timeString.match(/(\d{1,2}):(\d{2})/);
      if (!match) return timeString;
      
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const period = hours >= 12 ? 'PM' : 'AM';
      
      if (hours > 12) {
        hours -= 12;
      } else if (hours === 0) {
        hours = 12;
      }
      
      return `${hours}:${minutes} ${period}`;
    }
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
}
