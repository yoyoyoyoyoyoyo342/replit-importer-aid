import { useEffect, useState } from "react";

interface AnimatedWeatherBackgroundProps {
  condition?: string;
}

export function AnimatedWeatherBackground({ condition }: AnimatedWeatherBackgroundProps) {
  const [weatherType, setWeatherType] = useState<'clear' | 'rain' | 'snow' | 'cloudy' | 'storm'>('clear');

  useEffect(() => {
    if (!condition) return;
    
    const lowerCondition = condition.toLowerCase();
    
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
  }, [condition]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient background */}
      <div className={`absolute inset-0 transition-all duration-1000 ${
        weatherType === 'clear' ? 'bg-gradient-to-br from-blue-400 via-blue-300 to-blue-200' :
        weatherType === 'rain' ? 'bg-gradient-to-br from-gray-500 via-gray-400 to-gray-300' :
        weatherType === 'snow' ? 'bg-gradient-to-br from-blue-200 via-blue-100 to-gray-100' :
        weatherType === 'storm' ? 'bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500' :
        'bg-gradient-to-br from-gray-400 via-gray-300 to-gray-200'
      }`} />

      {/* Animated clouds */}
      {(weatherType === 'cloudy' || weatherType === 'rain' || weatherType === 'storm') && (
        <>
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
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

      <style>{`
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
      `}</style>
    </div>
  );
}
