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
      <DialogContent className="max-w-sm mx-4 bg-card rounded-2xl p-8 shadow-xl border">
        <DialogTitle className="sr-only">{message}</DialogTitle>
        <DialogDescription className="sr-only">{submessage}</DialogDescription>
        <div className="text-center">
          {/* Cloud-shaped loading animation */}
          <div className="relative w-20 h-14 mx-auto mb-4">
            <svg
              viewBox="0 0 100 60"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background cloud shape */}
              <path
                d="M85 45c8.284 0 15-6.716 15-15 0-7.18-5.045-13.185-11.78-14.655C86.456 6.876 78.718 0 69.286 0c-7.04 0-13.22 3.81-16.572 9.477C50.32 7.287 47.1 6 43.571 6c-8.284 0-15 6.716-15 15 0 .694.047 1.376.138 2.044C19.833 24.59 13 32.35 13 41.5c0 1.18.1 2.336.29 3.5H85z"
                className="fill-primary/10 stroke-primary/20"
                strokeWidth="2"
              />
              {/* Animated tracing path */}
              <path
                d="M85 45c8.284 0 15-6.716 15-15 0-7.18-5.045-13.185-11.78-14.655C86.456 6.876 78.718 0 69.286 0c-7.04 0-13.22 3.81-16.572 9.477C50.32 7.287 47.1 6 43.571 6c-8.284 0-15 6.716-15 15 0 .694.047 1.376.138 2.044C19.833 24.59 13 32.35 13 41.5c0 1.18.1 2.336.29 3.5H85z"
                className="stroke-primary"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                style={{
                  strokeDasharray: "300",
                  strokeDashoffset: "300",
                  animation: "cloud-trace 2s ease-in-out infinite"
                }}
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{message}</h3>
          <p className="text-muted-foreground text-sm">{submessage}</p>
        </div>
        <style>{`
          @keyframes cloud-trace {
            0% {
              stroke-dashoffset: 300;
            }
            50% {
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
