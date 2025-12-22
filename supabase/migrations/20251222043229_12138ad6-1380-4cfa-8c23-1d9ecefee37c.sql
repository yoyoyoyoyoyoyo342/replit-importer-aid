-- Create table for affiliate applications
CREATE TABLE public.affiliate_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  website_url TEXT NOT NULL,
  description TEXT,
  weather_condition TEXT NOT NULL, -- rain, snow, wind, storm, all
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  stripe_subscription_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view their own affiliate applications"
ON public.affiliate_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create their own affiliate applications"
ON public.affiliate_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own applications
CREATE POLICY "Users can update their own affiliate applications"
ON public.affiliate_applications
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all affiliate applications"
ON public.affiliate_applications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update any application
CREATE POLICY "Admins can update any affiliate application"
ON public.affiliate_applications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active approved affiliates (for displaying ads)
CREATE POLICY "Anyone can view active affiliates"
ON public.affiliate_applications
FOR SELECT
USING (status = 'approved' AND is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_affiliate_applications_updated_at
BEFORE UPDATE ON public.affiliate_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();