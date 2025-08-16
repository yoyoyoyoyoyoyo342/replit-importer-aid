-- Create user allergies table
CREATE TABLE public.user_allergies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  allergen TEXT NOT NULL,
  severity TEXT DEFAULT 'moderate',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, allergen)
);

-- Enable RLS
ALTER TABLE public.user_allergies ENABLE ROW LEVEL SECURITY;

-- Create policies
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