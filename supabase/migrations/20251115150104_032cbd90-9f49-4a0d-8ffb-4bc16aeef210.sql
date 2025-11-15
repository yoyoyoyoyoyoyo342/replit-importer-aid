-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add status column to weather_reports for approval workflow
ALTER TABLE public.weather_reports
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- RLS policy for admins to view all reports
CREATE POLICY "Admins can view all reports"
  ON public.weather_reports
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policy for admins to update reports
CREATE POLICY "Admins can update reports"
  ON public.weather_reports
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));