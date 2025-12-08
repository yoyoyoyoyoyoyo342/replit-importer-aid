import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import logoCloud from "@/assets/logo-cloud.png";

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  submessage?: string;
}

export function LoadingOverlay({ 
  isOpen, 
  message = "Fetching Weather Data", 
  submessage = "Comparing accuracy across sources..." 
}: LoadingOverlayProps) {
  return (
    <Dialog open={isOpen} modal>
      <DialogContent className="max-w-sm mx-4 bg-card rounded-2xl p-8 shadow-xl border flex flex-col items-center justify-center">
        <DialogTitle className="sr-only">{message}</DialogTitle>
        <DialogDescription className="sr-only">{submessage}</DialogDescription>
        <div className="text-center flex flex-col items-center">
          {/* Logo cloud with tracing animation */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-4">
            <img 
              src={logoCloud} 
              alt="Loading" 
              className="w-20 h-auto object-contain animate-pulse"
            />
            {/* Animated ring around the cloud */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-primary/20"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-primary"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                style={{
                  strokeDasharray: "70 213",
                  animation: "cloud-spin 1.5s linear infinite"
                }}
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{message}</h3>
          <p className="text-muted-foreground text-sm">{submessage}</p>
        </div>
        <style>{`
          @keyframes cloud-spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
