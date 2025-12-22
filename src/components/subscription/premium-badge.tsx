import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/use-subscription";

export function PremiumBadge({ className = "" }: { className?: string }) {
  const { isSubscribed } = useSubscription();

  if (!isSubscribed) return null;

  return (
    <Badge 
      className={`bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 ${className}`}
    >
      <Crown className="w-3 h-3 mr-1" />
      Plus
    </Badge>
  );
}
