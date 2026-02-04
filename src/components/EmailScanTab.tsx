import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, AlertTriangle, CheckCircle, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface EmailScanResult {
  sender: string;
  subject: string;
  result: "safe" | "phishing" | "suspicious";
  confidence: number;
  threatIndicators: string[];
  analysisDetails: {
    features: Record<string, unknown>;
    ruleBasedScore: number;
    aiScore: number;
    combinedScore: number;
  };
  blockchainHash: string;
}

interface EmailScanTabProps {
  onScanComplete?: (result: EmailScanResult) => void;
  userId?: string;
}

export function EmailScanTab({ onScanComplete, userId }: EmailScanTabProps) {
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmailScanResult | null>(null);

  const handleScan = async () => {
    if (!sender.trim() || !subject.trim() || !body.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!userId) {
      toast.error("Please sign in to scan emails");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ sender, subject, body }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      const data: EmailScanResult = await response.json();
      setResult(data);
      onScanComplete?.(data);

      if (data.result === "phishing") {
        toast.error("⚠️ EMAIL PHISHING DETECTED!", {
          description: `Confidence: ${data.confidence}%`,
        });
      } else if (data.result === "suspicious") {
        toast.warning("⚡ Suspicious email detected", {
          description: "Proceed with caution",
        });
      } else {
        toast.success("✓ Email appears safe", {
          description: `Confidence: ${data.confidence}%`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTestCase = (type: "phishing" | "safe") => {
    if (type === "phishing") {
      setSender("support@paypal-security.net");
      setSubject("URGENT: Your Account Has Been Suspended - Verify Now");
      setBody(`Dear Valued Customer,

We have detected unusual activity on your PayPal account. Your account has been temporarily suspended pending verification.

CLICK HERE to verify your identity immediately: http://paypal-verify-account.suspicious-site.xyz/login

If you do not verify within 24 hours, your account will be permanently closed and all funds will be frozen.

This is your FINAL NOTICE.

Best regards,
PayPal Security Team`);
    } else {
      setSender("no-reply@paypal.com");
      setSubject("Receipt for your payment");
      setBody(`Hello,

You sent a payment of $25.00 USD to Example Store.

Transaction ID: 1AB23456CD789012E
Date: February 4, 2026

If you have questions about this transaction, please contact us.

Thanks,
PayPal`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            Email Phishing Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTestCase("phishing")}
              className="text-xs"
            >
              Load Phishing Example
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTestCase("safe")}
              className="text-xs"
            >
              Load Safe Example
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Sender Email
            </label>
            <Input
              placeholder="support@example.com"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="bg-background/50 border-primary/30 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Subject Line
            </label>
            <Input
              placeholder="Email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-background/50 border-primary/30 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Email Body
            </label>
            <Textarea
              placeholder="Paste the email content here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[150px] bg-background/50 border-primary/30 focus:border-primary"
            />
          </div>

          <Button
            onClick={handleScan}
            disabled={isLoading}
            className="w-full"
            variant="neon"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Analyzing Email...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                ANALYZE EMAIL
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card
            className={`glass-card border-2 ${
              result.result === "phishing"
                ? "border-destructive/50 bg-destructive/5"
                : result.result === "suspicious"
                ? "border-warning/50 bg-warning/5"
                : "border-safe/50 bg-safe/5"
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {result.result === "phishing" ? (
                    <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
                  ) : result.result === "suspicious" ? (
                    <Shield className="h-6 w-6 text-warning" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-safe" />
                  )}
                  <span
                    className={
                      result.result === "phishing"
                        ? "text-destructive"
                        : result.result === "suspicious"
                        ? "text-warning"
                        : "text-safe"
                    }
                  >
                    {result.result === "phishing"
                      ? "EMAIL PHISHING DETECTED"
                      : result.result === "suspicious"
                      ? "SUSPICIOUS EMAIL"
                      : "EMAIL APPEARS SAFE"}
                  </span>
                </CardTitle>
                <Badge
                  variant={
                    result.result === "phishing"
                      ? "destructive"
                      : result.result === "suspicious"
                      ? "secondary"
                      : "default"
                  }
                  className="text-lg px-4 py-1"
                >
                  {result.confidence}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Threat Level</span>
                  <span>{result.confidence}%</span>
                </div>
                <Progress
                  value={result.confidence}
                  className={`h-3 ${
                    result.result === "phishing"
                      ? "[&>div]:bg-destructive"
                      : result.result === "suspicious"
                      ? "[&>div]:bg-warning"
                      : "[&>div]:bg-safe"
                  }`}
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">From: </span>
                  <span className="font-mono">{result.sender}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Subject: </span>
                  <span>{result.subject}</span>
                </div>
              </div>

              {result.threatIndicators.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-destructive">
                    Threat Indicators:
                  </h4>
                  <ul className="space-y-1">
                    {result.threatIndicators.map((indicator, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        {indicator}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.blockchainHash && (
                <div className="pt-4 border-t border-primary/20">
                  <p className="text-xs text-muted-foreground">
                    Blockchain Hash:{" "}
                    <span className="font-mono text-primary">
                      {result.blockchainHash.slice(0, 20)}...
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
