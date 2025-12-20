import { useEffect, useRef } from 'react';

interface GoogleAdProps {
  className?: string;
  adSlot: string;
  adClient: string;
}

export function GoogleAd({ className = '', adSlot = 'XXXXXXXXXX', adClient = 'ca-pub-XXXXXXXXXXXXXXXX' }: GoogleAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Load AdSense script if not already present
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Push the ad
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [adClient]);

  return (
    <div className={`google-ad-container flex justify-center ${className}`} aria-label="Advertisement">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minWidth: '300px', minHeight: '90px' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Keep CarbonAd as fallback/alternative
export function CarbonAd({ className = '' }: { className?: string }) {
  const adRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current || !adRef.current) return;

    const existingScript = document.getElementById('_carbonads_js');
    if (existingScript) {
      scriptLoaded.current = true;
      return;
    }

    const script = document.createElement('script');
    script.id = '_carbonads_js';
    script.async = true;
    script.src = '//cdn.carbonads.com/carbon.js?serve=PLACEHOLDER&placement=PLACEHOLDER';
    
    adRef.current.appendChild(script);
    scriptLoaded.current = true;

    return () => {
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
