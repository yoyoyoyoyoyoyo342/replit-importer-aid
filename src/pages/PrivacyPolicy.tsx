import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: January 2025</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Introduction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              This Privacy Policy describes how we collect, use, store, and protect your personal information when you use our weather prediction application ("the Service"). We are committed to protecting your privacy and complying with applicable data protection laws, including GDPR (General Data Protection Regulation) and CCPA (California Consumer Privacy Act).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <h4 className="font-semibold">2.1 Information You Provide</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Account Information:</strong> Email address, display name, and optional profile picture</li>
              <li><strong>Weather Predictions:</strong> Your submitted weather predictions and forecasts</li>
              <li><strong>Weather Reports:</strong> User-submitted weather observations and corrections</li>
              <li><strong>Location Data:</strong> Saved locations and addresses you search for</li>
              <li><strong>Preferences:</strong> Display settings, notification preferences, and cookie choices</li>
              <li><strong>Feedback:</strong> Messages and feedback you submit through our forms</li>
            </ul>

            <h4 className="font-semibold mt-4">2.2 Automatically Collected Information</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Location Data:</strong> Approximate geographic location (city/country) via IP address</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, interaction times</li>
              <li><strong>Session Data:</strong> Session IDs, visit duration, referrer URLs</li>
              <li><strong>Analytics Data:</strong> Page views and user journey information (only if analytics cookies are enabled)</li>
            </ul>

            <h4 className="font-semibold mt-4">2.3 Cookies and Tracking Technologies</h4>
            <p>We use the following types of cookies:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Necessary Cookies:</strong> Essential for authentication and core functionality</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the Service (requires consent)</li>
              <li><strong>Functional Cookies:</strong> Store preferences and enable enhanced features (requires consent)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>We use collected information for the following purposes:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Service Delivery:</strong> Provide weather predictions and location-based forecasts</li>
              <li><strong>Account Management:</strong> Create and maintain your user account</li>
              <li><strong>Personalization:</strong> Save your preferences and display customized content</li>
              <li><strong>Analytics:</strong> Understand usage patterns and improve the Service (with consent)</li>
              <li><strong>Notifications:</strong> Send weather alerts and updates if you opt in</li>
              <li><strong>Leaderboards:</strong> Display prediction accuracy rankings</li>
              <li><strong>Communication:</strong> Respond to feedback and support requests</li>
              <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security threats</li>
              <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our terms</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Data Sharing and Disclosure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <h4 className="font-semibold">4.1 Third-Party Service Providers</h4>
            <p>We share data with trusted third-party services:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Supabase:</strong> Database hosting and authentication</li>
              <li><strong>Weather APIs:</strong> WeatherAPI.com, Tomorrow.io for weather data</li>
              <li><strong>Nominatim:</strong> Address geocoding services</li>
            </ul>

            <h4 className="font-semibold mt-4">4.2 Public Information</h4>
            <p>The following information may be visible to other users:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Display name and profile picture</li>
              <li>Prediction accuracy and leaderboard rankings</li>
              <li>Weather reports you submit</li>
            </ul>

            <h4 className="font-semibold mt-4">4.3 Legal Requirements</h4>
            <p>
              We may disclose your information if required by law, court order, or government request, or to protect our rights, property, or safety.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Account Data:</strong> Retained while your account is active and for 90 days after deletion</li>
              <li><strong>Weather Predictions:</strong> Retained indefinitely for historical accuracy tracking</li>
              <li><strong>Analytics Data:</strong> Aggregated and anonymized after 12 months</li>
              <li><strong>Session Data:</strong> Retained for 30 days</li>
              <li><strong>Cookies:</strong> Stored based on your preferences (session or persistent)</li>
            </ul>
            <p className="mt-4">
              You can request deletion of your personal data at any time by contacting us or deleting your account through the application settings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Your Rights (GDPR & CCPA)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>Under GDPR and CCPA, you have the following rights:</p>
            
            <h4 className="font-semibold">6.1 Right to Access</h4>
            <p>Request a copy of all personal data we hold about you.</p>

            <h4 className="font-semibold">6.2 Right to Rectification</h4>
            <p>Correct inaccurate or incomplete personal data.</p>

            <h4 className="font-semibold">6.3 Right to Erasure ("Right to be Forgotten")</h4>
            <p>Request deletion of your personal data, subject to legal obligations.</p>

            <h4 className="font-semibold">6.4 Right to Data Portability</h4>
            <p>Receive your data in a structured, machine-readable format.</p>

            <h4 className="font-semibold">6.5 Right to Object</h4>
            <p>Object to processing of your data for specific purposes.</p>

            <h4 className="font-semibold">6.6 Right to Restrict Processing</h4>
            <p>Request limitation on how we use your data.</p>

            <h4 className="font-semibold">6.7 Right to Withdraw Consent</h4>
            <p>Withdraw consent for analytics and functional cookies at any time.</p>

            <h4 className="font-semibold">6.8 Right to Lodge a Complaint</h4>
            <p>File a complaint with your local data protection authority.</p>

            <p className="mt-4 font-semibold">
              To exercise any of these rights, contact us through the feedback form in application settings or by deleting your account directly in settings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Data Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>We implement appropriate technical and organizational measures to protect your data:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure authentication with password hashing</li>
              <li>Access controls and authorization checks</li>
              <li>Regular security audits and updates</li>
              <li>Data backup and recovery procedures</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              The Service is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that we have collected data from a child under 13, we will delete it immediately.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              Your data may be transferred to and processed in countries outside your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy in the application and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>11. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              For privacy-related questions, data requests, or to exercise your rights, please contact us through the feedback form in application settings.
            </p>
            <p className="mt-4">
              <strong>Data Protection Officer:</strong> Available through in-app feedback form
            </p>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground py-6">
          By using this Service, you acknowledge that you have read and understood this Privacy Policy.
        </div>
      </div>
    </div>
  );
}
