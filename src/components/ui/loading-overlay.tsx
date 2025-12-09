import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
          {/* Cloud tracing animation */}
          <div className="relative w-32 h-24 flex items-center justify-center mb-6">
            <svg
              viewBox="0 0 100 60"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background cloud shape (faint) */}
              <path
                d="M80 45 C80 45 85 45 85 38 C85 31 78 28 72 28 C72 20 65 12 52 12 C40 12 32 20 30 27 C22 27 15 33 15 42 C15 50 22 55 30 55 L75 55 C82 55 88 50 88 43 C88 36 82 32 75 32"
                className="stroke-muted/30"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              
              {/* Animated tracing cloud path */}
              <path
                d="M80 45 C80 45 85 45 85 38 C85 31 78 28 72 28 C72 20 65 12 52 12 C40 12 32 20 30 27 C22 27 15 33 15 42 C15 50 22 55 30 55 L75 55 C82 55 88 50 88 43 C88 36 82 32 75 32"
                className="stroke-primary"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                style={{
                  strokeDasharray: "300",
                  strokeDashoffset: "300",
                  animation: "trace-cloud 2.5s ease-in-out infinite"
                }}
              />
              
              {/* Glowing dot at the drawing point */}
              <circle
                r="3"
                className="fill-primary"
                style={{
                  animation: "move-along-cloud 2.5s ease-in-out infinite"
                }}
              >
                <animateMotion
                  dur="2.5s"
                  repeatCount="indefinite"
                  path="M80 45 C80 45 85 45 85 38 C85 31 78 28 72 28 C72 20 65 12 52 12 C40 12 32 20 30 27 C22 27 15 33 15 42 C15 50 22 55 30 55 L75 55 C82 55 88 50 88 43 C88 36 82 32 75 32"
                />
              </circle>
            </svg>
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full animate-pulse" />
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">{message}</h3>
          <p className="text-muted-foreground text-sm">{submessage}</p>
        </div>
        <style>{`
          @keyframes trace-cloud {
            0% {
              stroke-dashoffset: 300;
            }
            50% {
              stroke-dashoffset: 0;
            }
            50.1% {
              stroke-dashoffset: 0;
            }
            100% {
              stroke-dashoffset: -300;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
