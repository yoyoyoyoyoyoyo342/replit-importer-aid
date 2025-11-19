import { useEffect, useState } from "react";

interface AnimatedWeatherBackgroundProps {
  condition?: string;
  sunrise?: string;
  sunset?: string;
  moonPhase?: string;
}

export function AnimatedWeatherBackground({ condition, sunrise, sunset, moonPhase }: AnimatedWeatherBackgroundProps) {
  const [weatherType, setWeatherType] = useState<'clear' | 'rain' | 'snow' | 'cloudy' | 'storm' | 'sunrise' | 'sunset' | 'night'>('clear');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night' | 'sunrise' | 'sunset'>('day');
  const [showConditionOverlay, setShowConditionOverlay] = useState(false);

  // Determine time of day based on sunrise/sunset
  useEffect(() => {
    if (!sunrise || !sunset) return;
    
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
  }, [sunrise, sunset]);

  useEffect(() => {
    if (!condition) return;
    
    const lowerCondition = condition.toLowerCase();
    
    // Determine if we should show condition overlay during special times
    const hasWeatherCondition = 
      lowerCondition.includes('cloud') || 
      lowerCondition.includes('overcast') ||
      lowerCondition.includes('rain') ||
      lowerCondition.includes('drizzle') ||
      lowerCondition.includes('snow') ||
      lowerCondition.includes('sleet') ||
      lowerCondition.includes('fog') ||
      lowerCondition.includes('mist');
    
    // Check for special time of day backgrounds first
    if (timeOfDay === 'sunrise') {
      setWeatherType('sunrise');
      setShowConditionOverlay(hasWeatherCondition);
      return;
    } else if (timeOfDay === 'sunset') {
      setWeatherType('sunset');
      setShowConditionOverlay(hasWeatherCondition);
      return;
    } else if (timeOfDay === 'night') {
      setWeatherType('night');
      setShowConditionOverlay(hasWeatherCondition);
      return;
    }
    
    // Regular weather conditions during day
    setShowConditionOverlay(false);
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      setWeatherType('rain');
    } else if (lowerCondition.includes('snow') || lowerCondition.includes('sleet')) {
      setWeatherType('snow');
    } else if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
      setWeatherType('storm');
    } else if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
      setWeatherType('cloudy');
    } else {
      setWeatherType('clear');
    }
  }, [condition, timeOfDay]);

  // Helper function to get moon phase CSS class
  const getMoonPhaseClass = (phase?: string): string => {
    if (!phase) return '';
    
    const phaseMap: Record<string, string> = {
      'NEW_MOON': 'moon-new',
      'WAXING_CRESCENT': 'moon-waxing-crescent',
      'FIRST_QUARTER': 'moon-first-quarter',
      'WAXING_GIBBOUS': 'moon-waxing-gibbous',
      'FULL_MOON': '',
      'WANING_GIBBOUS': 'moon-waning-gibbous',
      'LAST_QUARTER': 'moon-last-quarter',
      'WANING_CRESCENT': 'moon-waning-crescent'
    };
    
    return phaseMap[phase] || '';
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient background */}
      <div className={`absolute inset-0 transition-all duration-1000 ${
        weatherType === 'sunrise' ? 'bg-gradient-to-b from-blue-300 via-blue-200 to-red-200' :
        weatherType === 'sunset' ? 'bg-gradient-to-b from-pink-400 via-orange-400 to-indigo-900' :
        weatherType === 'night' ? 'bg-gradient-to-br from-indigo-950 via-blue-950 to-blue-900' :
        weatherType === 'clear' ? 'bg-gradient-to-br from-blue-400 via-blue-300 to-blue-200' :
        weatherType === 'rain' ? 'bg-gradient-to-br from-gray-500 via-gray-400 to-gray-300' :
        weatherType === 'snow' ? 'bg-gradient-to-br from-blue-200 via-blue-100 to-gray-100' :
        weatherType === 'storm' ? 'bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500' :
        'bg-gradient-to-br from-gray-400 via-gray-300 to-gray-200'
      }`} />

      {/* Moon for night */}
      {weatherType === 'night' && (
        <div className={`moon ${getMoonPhaseClass(moonPhase)}`} />
      )}

      {/* Sun for sunrise */}
      {weatherType === 'sunrise' && (
        <div className="sun sun-rise" />
      )}

      {/* Sun for sunset */}
      {weatherType === 'sunset' && (
        <div className="sun sun-set" />
      )}

      {/* Animated clouds */}
      {(weatherType === 'cloudy' || weatherType === 'rain' || weatherType === 'storm') && (
        <>
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
        </>
      )}

      {/* Condition overlay for night/sunrise/sunset */}
      {showConditionOverlay && (weatherType === 'night' || weatherType === 'sunrise' || weatherType === 'sunset') && condition && (
        <>
          {/* Show clouds for cloudy conditions */}
          {(condition.toLowerCase().includes('cloud') || condition.toLowerCase().includes('overcast')) && (
            <>
              <div className="cloud cloud-1 opacity-60" />
              <div className="cloud cloud-2 opacity-50" />
              <div className="cloud cloud-3 opacity-70" />
            </>
          )}
          
          {/* Show rain overlay */}
          {(condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('drizzle')) && (
            <div className="rain-container opacity-70">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="raindrop" style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`
                }} />
              ))}
            </div>
          )}
          
          {/* Show snow overlay */}
          {(condition.toLowerCase().includes('snow') || condition.toLowerCase().includes('sleet')) && (
            <div className="snow-container opacity-70">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="snowflake" style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${5 + Math.random() * 5}s`,
                  fontSize: `${10 + Math.random() * 10}px`
                }}>❄</div>
              ))}
            </div>
          )}
          
          {/* Show fog/mist overlay */}
          {(condition.toLowerCase().includes('fog') || condition.toLowerCase().includes('mist')) && (
            <div className="fog-overlay" />
          )}
        </>
      )}

      {/* Rain animation */}
      {(weatherType === 'rain' || weatherType === 'storm') && (
        <div className="rain-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="raindrop" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`
            }} />
          ))}
        </div>
      )}

      {/* Snow animation */}
      {weatherType === 'snow' && (
        <div className="snow-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="snowflake" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
              fontSize: `${10 + Math.random() * 10}px`
            }}>❄</div>
          ))}
        </div>
      )}

      {/* Lightning for storm */}
      {weatherType === 'storm' && (
        <div className="lightning" />
      )}

      {/* Subtle stars for night */}
      {weatherType === 'night' && (
        <div className="stars-container">
          {Array.from({ length: 80 }).map((_, i) => (
            <div key={i} className="star" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }} />
          ))}
        </div>
      )}

      <style>{`
        /* Moon - minimalist style */
        .moon {
          position: absolute;
          width: 80px;
          height: 80px;
          top: 15%;
          right: 15%;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
        }
        
        /* Moon phases */
        .moon-new {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .moon-waxing-crescent::before,
        .moon-waning-crescent::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(20, 30, 60, 0.9);
        }
        
        .moon-waxing-crescent::before {
          right: 20%;
        }
        
        .moon-waning-crescent::before {
          left: 20%;
        }
        
        .moon-first-quarter::before,
        .moon-last-quarter::before {
          content: '';
          position: absolute;
          width: 50%;
          height: 100%;
          background: rgba(20, 30, 60, 0.9);
        }
        
        .moon-first-quarter::before {
          right: 0;
          border-radius: 0 50% 50% 0;
        }
        
        .moon-last-quarter::before {
          left: 0;
          border-radius: 50% 0 0 50%;
        }
        
        .moon-waxing-gibbous::before,
        .moon-waning-gibbous::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(20, 30, 60, 0.9);
        }
        
        .moon-waxing-gibbous::before {
          right: -50%;
        }
        
        .moon-waning-gibbous::before {
          left: -50%;
        }
        
        /* Sun - minimalist style */
        .sun {
          position: absolute;
          width: 100px;
          height: 100px;
          background: rgba(255, 230, 100, 0.9);
          border-radius: 50%;
          box-shadow: 0 0 50px rgba(255, 230, 100, 0.5);
        }
        
        .sun-rise {
          bottom: 10%;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .sun-set {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        /* Stars - subtle and atmospheric */
        .stars-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        
        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          animation: twinkle linear infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        .cloud {
          position: absolute;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 100px;
          animation: float 20s infinite ease-in-out;
        }
        
        .cloud::before,
        .cloud::after {
          content: '';
          position: absolute;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 100px;
        }
        
        .cloud-1 {
          width: 100px;
          height: 40px;
          top: 10%;
          left: -10%;
          animation-duration: 25s;
        }
        
        .cloud-1::before {
          width: 50px;
          height: 50px;
          top: -25px;
          left: 10px;
        }
        
        .cloud-1::after {
          width: 60px;
          height: 40px;
          top: -15px;
          right: 10px;
        }
        
        .cloud-2 {
          width: 120px;
          height: 50px;
          top: 30%;
          left: -15%;
          animation-duration: 30s;
          animation-delay: 5s;
        }
        
        .cloud-2::before {
          width: 60px;
          height: 60px;
          top: -30px;
          left: 15px;
        }
        
        .cloud-2::after {
          width: 70px;
          height: 50px;
          top: -20px;
          right: 15px;
        }
        
        .cloud-3 {
          width: 90px;
          height: 35px;
          top: 50%;
          left: -10%;
          animation-duration: 22s;
          animation-delay: 10s;
        }
        
        .cloud-3::before {
          width: 45px;
          height: 45px;
          top: -20px;
          left: 10px;
        }
        
        .cloud-3::after {
          width: 55px;
          height: 35px;
          top: -12px;
          right: 10px;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          50% {
            transform: translateX(120vw) translateY(-20px);
          }
        }
        
        /* Fog overlay */
        .fog-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(200, 200, 220, 0.4) 0%,
            rgba(220, 220, 230, 0.3) 30%,
            rgba(200, 200, 220, 0.2) 60%,
            transparent 100%
          );
          animation: fogDrift 8s ease-in-out infinite;
        }
        
        @keyframes fogDrift {
          0%, 100% {
            opacity: 0.5;
            transform: translateX(0);
          }
          50% {
            opacity: 0.7;
            transform: translateX(-20px);
          }
        }
        
        .rain-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        
        .raindrop {
          position: absolute;
          top: -10px;
          width: 2px;
          height: 20px;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.1));
          animation: fall linear infinite;
        }
        
        @keyframes fall {
          to {
            transform: translateY(100vh);
          }
        }
        
        .snow-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        
        .snowflake {
          position: absolute;
          top: -10px;
          color: white;
          opacity: 0.8;
          animation: snowfall linear infinite;
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
        }
        
        @keyframes snowfall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
        
        .lightning {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0);
          animation: flash 5s infinite;
        }
        
        @keyframes flash {
          0%, 100% { background: rgba(255, 255, 255, 0); }
          2%, 4% { background: rgba(255, 255, 255, 0.6); }
        }
        
        /* Fog overlay */
        .fog-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(200, 200, 220, 0.4) 0%,
            rgba(220, 220, 230, 0.3) 30%,
            rgba(200, 200, 220, 0.2) 60%,
            transparent 100%
          );
          animation: fogDrift 8s ease-in-out infinite;
        }
        
        @keyframes fogDrift {
          0%, 100% {
            opacity: 0.5;
            transform: translateX(0);
          }
          50% {
            opacity: 0.7;
            transform: translateX(-20px);
          }
        }
      `}</style>
    </div>
  );
}
