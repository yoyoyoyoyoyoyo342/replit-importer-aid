-- Drop the overly permissive policy that exposes all profile data to authenticated users
DROP POLICY IF EXISTS "Public profile info viewable by authenticated users" ON profiles;