-- Fix the overly permissive profiles table RLS policy
-- Remove the policy that allows all authenticated users to view all profiles
DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.profiles;

-- The existing "Users can view their own complete profile" policy already handles 
-- users viewing their own profiles with: (auth.uid() = user_id)
-- This ensures users can only see their own profile data

-- If applications need to show public profile info, they should use the 
-- get_public_profile() function which provides controlled access to specific fields