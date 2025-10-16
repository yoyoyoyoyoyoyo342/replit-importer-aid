import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MapPin, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPng } from 'html-to-image';
import { useEffect, useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface LocationCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  temperature: number;
  location: string;
  isImperial: boolean;
}

export function LocationCard({ open, onOpenChange, temperature, location, isImperial }: LocationCardProps) {
  const displayTemp = Math.round(isImperial ? temperature : (temperature - 32) * 5 / 9);
  const cityName = location.split(',')[0].trim().toUpperCase();
  const cardRef = useRef<HTMLDivElement>(null);
  const [landmarkImage, setLandmarkImage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [landmarkName, setLandmarkName] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (location && !landmarkImage && !hasError) {
      generateLandmarkImage();
    }
  }, [location]);

  const generateLandmarkImage = async () => {
    setIsGenerating(true);
    setHasError(false);
    try {
      console.log('Finding landmark for:', location);
      
      const { data, error } = await supabase.functions.invoke('generate-landmark-image', {
        body: { location }
      });

      console.log('Landmark response:', data, 'Error:', error);

      if (error) {
        console.error('Supabase function error:', error);
        setHasError(true);
        throw error;
      }
      
      if (data?.image) {
        console.log('Found landmark:', data.landmark, 'Image length:', data.image.length);
        setLandmarkName(data.landmark);
        setLandmarkImage(data.image);
      } else {
        console.error('No image in response data');
        setHasError(true);
      }
    } catch (error) {
      console.error('Error finding landmark:', error);
      setHasError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
      });
      
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Try Web Share API first (mobile)
      if (navigator.share) {
        try {
          const file = new File([blob], `${cityName}-weather-card.png`, { type: 'image/png' });
          await navigator.share({
            files: [file],
            title: `${cityName} Weather Card`,
          });
          return;
        } catch (shareError) {
          console.log('Share failed, falling back to download:', shareError);
        }
      }
      
      // Fallback: direct download
      const link = document.createElement('a');
      link.download = `${cityName}-weather-card.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading card:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0">
        <VisuallyHidden>
          <DialogTitle>{cityName} Weather Card</DialogTitle>
          <DialogDescription>
            Download a weather card for {cityName} showing current temperature and location
          </DialogDescription>
        </VisuallyHidden>
        <div ref={cardRef} className="relative w-full aspect-[3/4] overflow-hidden">
          {/* Beautiful Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20"></div>
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-300 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
          </div>

          {/* Loading Indicator */}
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
              <div className="text-white text-lg font-semibold">Generating landmark...</div>
            </div>
          )}

          {/* Landmark Image Background - Overlays gradient when available */}
          {landmarkImage && (
            <div className="absolute inset-0 z-[1]">
              <img 
                src={landmarkImage} 
                alt={`${landmarkName || cityName} landmark`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Image failed to load');
                  e.currentTarget.style.display = 'none';
                  setHasError(true);
                }}
                onLoad={() => console.log('Image loaded successfully')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            </div>
          )}

          {/* Temperature Display */}
          <div className="absolute top-12 left-8 z-[2]">
            <div className="text-[120px] leading-none font-black text-white drop-shadow-2xl">
              {displayTemp}°
            </div>
            <div className="text-2xl font-bold text-white/90 mt-2">
              {isImperial ? 'Fahrenheit' : 'Celsius'}
            </div>
          </div>

          {/* Location Display */}
          <div className="absolute bottom-20 left-8 right-8 z-[2]">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-10 h-10 text-white drop-shadow-lg" fill="white" />
              <div className="text-5xl font-black text-white drop-shadow-2xl leading-tight">
                {cityName}
              </div>
            </div>
            <div className="text-lg text-white/80 font-medium mt-2">
              {location.split(',').slice(1).join(',').trim() || 'Rainz'}
            </div>
          </div>

          {/* Download Button */}
          <Button
            onClick={handleDownload}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md border-2 border-white/40 text-white hover:bg-white/30 z-[2]"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Card
          </Button>

          {/* Decorative Bottom Pattern */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-[2]"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
