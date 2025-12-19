import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        navigate('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        navigate('/');
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {}
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ variant: "destructive", title: "Sign In Failed", description: error.message });
        return;
      }
      if (data.user) {
        toast({ title: "Welcome back!", description: "You've been signed in successfully." });
        window.location.href = '/';
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sign In Failed", description: error.message || "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your email address first." });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`
      });
      if (error) {
        toast({ variant: "destructive", title: "Password Reset Failed", description: error.message });
        return;
      }
      toast({ title: "Reset Link Sent!", description: "Check your email for a password reset link." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Password Reset Failed", description: error.message || "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      cleanupAuthState();
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl }
      });
      if (error) {
        let errorMessage = error.message;
        if (error.message.includes('Database error')) {
          errorMessage = "This email may already be registered. Try signing in instead.";
        } else if (error.message.includes('already registered')) {
          errorMessage = "This email is already registered. Please sign in instead.";
        }
        toast({ variant: "destructive", title: "Sign Up Failed", description: errorMessage });
        return;
      }
      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            user_id: data.user.id,
            username: email.split('@')[0],
            display_name: email.split('@')[0],
            notification_enabled: false,
            notification_time: '08:00'
          }, { onConflict: 'user_id' });
        } catch (profileErr) {
          console.log('Profile upsert skipped:', profileErr);
        }
        toast({ title: "Account Created!", description: "Please check your email to verify your account." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sign Up Failed", description: error.message || "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Rainz</CardTitle>
          <CardDescription>Sign in to save your preferences and get personalized alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="signin-password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter your password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      className="pr-10"
                    />
                    <div
                      role="button"
                      tabIndex={0}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(prev => !prev)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPassword(prev => !prev); }}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <Button type="button" variant="ghost" className="w-full text-sm" onClick={handleForgotPassword} disabled={loading}>
                  Forgot your password?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="signup-password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Create a password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      minLength={6}
                      className="pr-10"
                    />
                    <div
                      role="button"
                      tabIndex={0}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(prev => !prev)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPassword(prev => !prev); }}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
                <Button type="button" variant="ghost" className="w-full text-sm" onClick={handleForgotPassword} disabled={loading}>
                  Already have an account but forgot password?
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
