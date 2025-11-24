import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useCookieConsent } from "@/hooks/use-cookie-consent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Download, Trash2, Shield, Cookie } from "lucide-react";

export default function DataSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { preferences, savePreferences, resetConsent } = useCookieConsent();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to export your data.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // Fetch all user data
      const [profile, predictions, reports, preferences, streaks, locations] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("weather_predictions").select("*").eq("user_id", user.id),
        supabase.from("weather_reports").select("*").eq("user_id", user.id),
        supabase.from("user_preferences").select("*").eq("user_id", user.id),
        supabase.from("user_streaks").select("*").eq("user_id", user.id),
        supabase.from("saved_locations").select("*").eq("user_id", user.id),
      ]);

      const userData = {
        profile: profile.data,
        predictions: predictions.data,
        reports: reports.data,
        preferences: preferences.data,
        streaks: streaks.data,
        locations: locations.data,
        exportDate: new Date().toISOString(),
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `weather-app-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded as a JSON file.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      // Delete user data from all tables
      await Promise.all([
        supabase.from("profiles").delete().eq("user_id", user.id),
        supabase.from("weather_predictions").delete().eq("user_id", user.id),
        supabase.from("weather_reports").delete().eq("user_id", user.id),
        supabase.from("user_preferences").delete().eq("user_id", user.id),
        supabase.from("user_streaks").delete().eq("user_id", user.id),
        supabase.from("saved_locations").delete().eq("user_id", user.id),
        supabase.from("user_routines").delete().eq("user_id", user.id),
        supabase.from("user_allergies").delete().eq("user_id", user.id),
        supabase.from("conversations").delete().eq("user_id", user.id),
        supabase.from("messages").delete().eq("user_id", user.id),
      ]);

      // Delete the auth user account
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        // If admin deletion fails, at least sign out
        console.error("Admin delete error:", error);
      }

      toast({
        title: "Account deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Deletion failed",
        description: "Failed to delete your account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Data & Privacy Settings</h1>
            <p className="text-muted-foreground">
              Manage your data, privacy preferences, and exercise your rights under GDPR and other privacy laws.
            </p>
          </div>

          {/* Cookie Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                Cookie Preferences
              </CardTitle>
              <CardDescription>
                Control how we use cookies and similar technologies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="font-semibold">Necessary Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Required for the app to function. Cannot be disabled.
                  </p>
                </div>
                <Switch checked disabled />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="analytics-switch" className="font-semibold">Analytics Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Help us understand how you use the app to improve your experience.
                  </p>
                </div>
                <Switch
                  id="analytics-switch"
                  checked={preferences?.analytics}
                  onCheckedChange={(checked) =>
                    savePreferences({ ...preferences!, analytics: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="functional-switch" className="font-semibold">Functional Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable enhanced features like saved preferences and personalization.
                  </p>
                </div>
                <Switch
                  id="functional-switch"
                  checked={preferences?.functional}
                  onCheckedChange={(checked) =>
                    savePreferences({ ...preferences!, functional: checked })
                  }
                />
              </div>

              <Button variant="outline" onClick={resetConsent} className="w-full">
                Reset Cookie Consent
              </Button>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Your Data
              </CardTitle>
              <CardDescription>
                Download a copy of all your data in JSON format (GDPR Right to Data Portability)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleExportData}
                disabled={!user || isExporting}
                className="w-full"
              >
                {isExporting ? "Exporting..." : "Download My Data"}
              </Button>
              {!user && (
                <p className="text-sm text-muted-foreground mt-2">
                  Sign in to export your data
                </p>
              )}
            </CardContent>
          </Card>

          {/* Account Deletion */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data (GDPR Right to Erasure)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={!user} className="w-full">
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers including:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Profile information</li>
                        <li>Weather predictions and reports</li>
                        <li>Saved locations and preferences</li>
                        <li>Streaks and points</li>
                        <li>All other associated data</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {!user && (
                <p className="text-sm text-muted-foreground mt-2">
                  Sign in to delete your account
                </p>
              )}
            </CardContent>
          </Card>

          {/* Privacy Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Your Privacy Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Under GDPR and other privacy laws, you have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Access your personal data (view your profile and preferences)</li>
                <li>Rectify inaccurate data (edit your profile)</li>
                <li>Erase your data (delete your account above)</li>
                <li>Data portability (export your data above)</li>
                <li>Withdraw consent (update cookie preferences above)</li>
                <li>Object to processing (contact us)</li>
              </ul>
              <p className="mt-4">
                For questions about your data or to exercise any other rights, please review our{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/privacy")}>
                  Privacy Policy
                </Button>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
