-- Create user_allergies table for tracking personal allergies
CREATE TABLE IF NOT EXISTS public.user_allergies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allergen TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, allergen)
);

-- Enable Row Level Security
ALTER TABLE public.user_allergies ENABLE ROW LEVEL SECURITY;

-- Create policies for user allergies
CREATE POLICY "Users can view their own allergies" 
ON public.user_allergies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own allergies" 
ON public.user_allergies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own allergies" 
ON public.user_allergies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own allergies" 
ON public.user_allergies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_allergies_updated_at
  BEFORE UPDATE ON public.user_allergies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();