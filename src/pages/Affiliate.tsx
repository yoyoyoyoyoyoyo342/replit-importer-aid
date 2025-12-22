import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CloudRain, Snowflake, Wind, Zap, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const AFFILIATE_PRODUCT = {
  price_id: "price_1Sh0n18mRhH1c6KOhmxF97O8",
  product_id: "prod_TeJPOGKdFelTsG",
  name: "Rainz Affiliate Spot",
  price: "€10",
  interval: "month",
};

const affiliateSchema = z.object({
  businessName: z.string().trim().min(2, "Business name must be at least 2 characters").max(100, "Business name is too long"),
  contactEmail: z.string().trim().email("Invalid email address").max(255, "Email is too long"),
  websiteUrl: z.string().trim().url("Invalid URL - must start with https://").refine((url) => url.startsWith("https://"), "URL must use HTTPS"),
  description: z.string().trim().max(500, "Description is too long").optional(),
  weatherCondition: z.enum(["rain", "snow", "wind", "storm", "all"], { required_error: "Please select a weather condition" }),
});

const weatherConditions = [
  { value: "rain", label: "When it's Raining", icon: CloudRain, description: "Your link shows when rain is detected" },
  { value: "snow", label: "When it's Snowing", icon: Snowflake, description: "Your link shows during snowfall" },
  { value: "wind", label: "When it's Windy", icon: Wind, description: "Your link shows during high winds" },
  { value: "storm", label: "During Storms", icon: Zap, description: "Your link shows during thunderstorms" },
  { value: "all", label: "All Conditions", icon: CloudRain, description: "Your link shows for all weather" },
];

export default function Affiliate() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    businessName: "",
    contactEmail: user?.email || "",
    websiteUrl: "",
    description: "",
    weatherCondition: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!user || !session?.access_token) {
      toast({
        title: "Sign in required",
        description: "Please sign in to apply for an affiliate spot.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Validate form
    const result = affiliateSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      // Create affiliate application first
      const { data: application, error: appError } = await supabase
        .from("affiliate_applications")
        .insert({
          user_id: user.id,
          business_name: result.data.businessName,
          contact_email: result.data.contactEmail,
          website_url: result.data.websiteUrl,
          description: result.data.description || null,
          weather_condition: result.data.weatherCondition,
          status: "pending",
        })
        .select()
        .single();

      if (appError) throw appError;

      // Create checkout session
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke("create-affiliate-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          application_id: application.id,
        },
      });

      if (checkoutError || !checkoutData?.url) {
        throw new Error(checkoutError?.message || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      window.location.href = checkoutData.url;
    } catch (error) {
      console.error("Affiliate application error:", error);
      toast({
        title: "Application failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Application Submitted!</h2>
            <p className="text-muted-foreground">
              We'll review your application and get back to you within 24-48 hours.
            </p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Return to Rainz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Become a Rainz Affiliate</h1>
          <p className="text-muted-foreground">
            Advertise your business to Rainz users when specific weather conditions are active.
          </p>
        </div>

        {/* Pricing Card */}
        <Card className="mb-8 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{AFFILIATE_PRODUCT.name}</CardTitle>
            <CardDescription>
              <span className="text-4xl font-bold text-foreground">{AFFILIATE_PRODUCT.price}</span>
              <span className="text-muted-foreground">/{AFFILIATE_PRODUCT.interval}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Display your link when your chosen weather is active
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Contextual advertising reaches users when they care most
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Cancel anytime with no commitment
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Reviewed and approved within 24-48 hours
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Apply for an Affiliate Spot</CardTitle>
            <CardDescription>
              Fill out the form below and proceed to payment. Your spot will be activated once approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="Your Business Name"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className={errors.businessName ? "border-destructive" : ""}
                />
                {errors.businessName && <p className="text-xs text-destructive">{errors.businessName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className={errors.contactEmail ? "border-destructive" : ""}
                />
                {errors.contactEmail && <p className="text-xs text-destructive">{errors.contactEmail}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL *</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className={errors.websiteUrl ? "border-destructive" : ""}
                />
                {errors.websiteUrl && <p className="text-xs text-destructive">{errors.websiteUrl}</p>}
                <p className="text-xs text-muted-foreground">This is where users will be directed when they click your link</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about your business and why it's relevant to weather..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={errors.description ? "border-destructive" : ""}
                  rows={3}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
              </div>

              <div className="space-y-2">
                <Label>When should your link appear? *</Label>
                <Select
                  value={formData.weatherCondition}
                  onValueChange={(value) => setFormData({ ...formData, weatherCondition: value })}
                >
                  <SelectTrigger className={errors.weatherCondition ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select a weather condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {weatherConditions.map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>
                        <div className="flex items-center gap-2">
                          <condition.icon className="w-4 h-4" />
                          <span>{condition.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.weatherCondition && <p className="text-xs text-destructive">{errors.weatherCondition}</p>}
                {formData.weatherCondition && (
                  <p className="text-xs text-muted-foreground">
                    {weatherConditions.find((c) => c.value === formData.weatherCondition)?.description}
                  </p>
                )}
              </div>

              <div className="pt-4 space-y-4">
                <p className="text-xs text-muted-foreground">
                  By submitting this application, you agree to our{" "}
                  <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate("/affiliate-policy")}>
                    Affiliate Policy
                  </Button>
                  {" "}and{" "}
                  <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate("/terms")}>
                    Terms of Service
                  </Button>
                  .
                </p>

                {!user ? (
                  <Button type="button" className="w-full" onClick={() => navigate("/auth")}>
                    Sign In to Apply
                  </Button>
                ) : (
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Continue to Payment ({AFFILIATE_PRODUCT.price}/month)
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
