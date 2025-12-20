import { useEffect, useRef } from 'react';

interface CarbonAdProps {
  className?: string;
}

export function CarbonAd({ className = '' }: CarbonAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current || !adRef.current) return;

    // Check if script already exists
    const existingScript = document.getElementById('_carbonads_js');
    if (existingScript) {
      scriptLoaded.current = true;
      return;
    }

    const script = document.createElement('script');
    script.id = '_carbonads_js';
    script.async = true;
    // Replace with your Carbon Ads serve URL when you have one
    script.src = '//cdn.carbonads.com/carbon.js?serve=PLACEHOLDER&placement=PLACEHOLDER';
    
    adRef.current.appendChild(script);
    scriptLoaded.current = true;

    return () => {
      // Cleanup on unmount
      const carbonAds = document.getElementById('carbonads');
      if (carbonAds) carbonAds.remove();
    };
  }, []);

  return (
    <div 
      ref={adRef} 
      className={`carbon-ad-container flex justify-center ${className}`}
      aria-label="Advertisement"
    />
  );
}
