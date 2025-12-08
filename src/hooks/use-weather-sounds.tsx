import { useEffect, useRef, useState, useCallback } from 'react';

// Weather sound URLs - using free ambient sounds
const WEATHER_SOUNDS: Record<string, string> = {
  rain: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3',
  thunder: 'https://assets.mixkit.co/active_storage/sfx/1282/1282-preview.mp3',
  wind: 'https://assets.mixkit.co/active_storage/sfx/2520/2520-preview.mp3',
  snow: 'https://assets.mixkit.co/active_storage/sfx/2518/2518-preview.mp3',
};

type WeatherType = 'rain' | 'thunder' | 'wind' | 'snow' | 'clear' | null;

export function useWeatherSounds(condition: string, enabled: boolean = true) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState<WeatherType>(null);
  const [volume, setVolume] = useState(0.3);
  const hasAutoPlayed = useRef(false);

  const getWeatherType = useCallback((cond: string): WeatherType => {
    const c = cond.toLowerCase();
    if (c.includes('thunder') || c.includes('storm')) return 'thunder';
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return 'rain';
    if (c.includes('snow') || c.includes('sleet') || c.includes('blizzard')) return 'snow';
    if (c.includes('wind') || c.includes('gust')) return 'wind';
    return 'clear';
  }, []);

  const playSound = useCallback((type: WeatherType) => {
    if (!type || type === 'clear' || !WEATHER_SOUNDS[type]) {
      stopSound();
      return;
    }

    // If same sound is already playing, don't restart
    if (currentSound === type && isPlaying) return;

    // Stop current sound first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(WEATHER_SOUNDS[type]);
    audio.loop = true;
    audio.volume = volume;
    
    audio.play().then(() => {
      setIsPlaying(true);
      setCurrentSound(type);
      console.log(`🔊 Playing ${type} sounds`);
    }).catch(err => {
      console.log('Audio autoplay blocked:', err);
      setIsPlaying(false);
    });

    audioRef.current = audio;
  }, [currentSound, isPlaying, volume]);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentSound(null);
  }, []);

  const toggleSound = useCallback(() => {
    if (isPlaying) {
      stopSound();
    } else {
      const type = getWeatherType(condition);
      playSound(type);
    }
  }, [isPlaying, condition, getWeatherType, playSound, stopSound]);

  const changeVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // Auto-play weather sounds when condition has active weather
  useEffect(() => {
    if (!enabled) {
      stopSound();
      return;
    }

    const type = getWeatherType(condition);
    
    // Auto-play if there's active weather and we haven't auto-played yet
    if (type !== 'clear' && type !== currentSound) {
      // Small delay to let the page load
      const timer = setTimeout(() => {
        playSound(type);
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    // If weather cleared, stop the sound
    if (type === 'clear' && isPlaying) {
      stopSound();
    }
  }, [condition, enabled, getWeatherType, currentSound, playSound, stopSound, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    isPlaying,
    currentSound,
    weatherType: getWeatherType(condition),
    playSound: () => playSound(getWeatherType(condition)),
    stopSound,
    toggleSound,
    volume,
    changeVolume,
    hasWeatherSound: getWeatherType(condition) !== 'clear',
  };
}
