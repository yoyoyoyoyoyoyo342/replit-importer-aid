import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface WeatherReportFormProps {
  location: string;
  currentCondition: string;
}

export function WeatherReportForm({ location, currentCondition }: WeatherReportFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [accuracy, setAccuracy] = useState("");
  const [report, setReport] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Check if user has been registered for at least 3 months
  const canReportWeather = () => {
    if (!user || !profile?.created_at) return false;
    
    const accountAge = new Date().getTime() - new Date(profile.created_at).getTime();
    const threeMonthsInMs = 90 * 24 * 60 * 60 * 1000; // 90 days
    return accountAge >= threeMonthsInMs;
  };

  const handleSubmit = async () => {
    if (!canReportWeather()) {
      toast({
        title: "Account too new",
        description: "You need to have an account for at least 3 months to report weather.",
        variant: "destructive",
      });
      return;
    }

    if (!accuracy || !report.trim()) {
      toast({
        title: "Please fill all fields",
        description: "Both accuracy rating and report are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Report submitted",
      description: "Thank you for helping improve weather accuracy!",
    });
    
    setIsOpen(false);
    setAccuracy("");
    setReport("");
    setIsSubmitting(false);
  };

  // Don't show the button if user can't report weather
  if (!user || !canReportWeather()) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Report Weather
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Weather Accuracy</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Location: {location}
            </label>
            <label className="text-sm text-muted-foreground mb-3 block">
              Reported condition: {currentCondition}
            </label>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              How accurate is this forecast?
            </label>
            <Select value={accuracy} onValueChange={setAccuracy}>
              <SelectTrigger>
                <SelectValue placeholder="Select accuracy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very-accurate">Very Accurate</SelectItem>
                <SelectItem value="mostly-accurate">Mostly Accurate</SelectItem>
                <SelectItem value="somewhat-accurate">Somewhat Accurate</SelectItem>
                <SelectItem value="not-accurate">Not Accurate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              What's the actual weather like?
            </label>
            <Textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              placeholder="Describe the current weather conditions..."
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Send className="w-4 h-4 mr-2 animate-pulse" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}