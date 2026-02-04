import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Image, Upload, Link, AlertTriangle, CheckCircle, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface LogoScanResult {
  imageUrl: string;
  result: "safe" | "phishing" | "unknown";
  confidence: number;
  detectedBrand: string | null;
  threatIndicators: string[];
  analysisDetails: {
    urlAnalysis: {
      suspicions: string[];
      detectedBrand: string | null;
    };
    aiAnalysis: {
      brandDetected: string | null;
      isAuthentic: boolean;
      confidence: number;
      issues: string[];
      reasoning: string;
    };
  };
  blockchainHash: string;
}

interface LogoScanTabProps {
  onScanComplete?: (result: LogoScanResult) => void;
  userId?: string;
}

export function LogoScanTab({ onScanComplete, userId }: LogoScanTabProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LogoScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewImage(base64);
      setImageUrl("");
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    if (url.startsWith("http")) {
      setPreviewImage(url);
    }
  };

  const loadTestCase = (type: "phishing" | "safe") => {
    if (type === "phishing") {
      // Fake PayPal logo hosted on suspicious domain
      const fakeUrl = "https://suspicious-site.xyz/paypal-logo-modified.png";
      setImageUrl(fakeUrl);
      setPreviewImage("https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/320px-PayPal.svg.png");
    } else {
      // Real Amazon logo
      setImageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png");
      setPreviewImage("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png");
    }
  };

  const handleScan = async () => {
    if (!imageUrl && !previewImage) {
      toast.error("Please provide an image URL or upload a file");
      return;
    }

    if (!userId) {
      toast.error("Please sign in to scan logos");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const payload: { imageUrl?: string; base64Image?: string } = {};
      
      if (imageUrl) {
        payload.imageUrl = imageUrl;
      } else if (previewImage?.startsWith("data:")) {
        payload.base64Image = previewImage;
      } else if (previewImage) {
        payload.imageUrl = previewImage;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-logo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      const data: LogoScanResult = await response.json();
      setResult(data);
      onScanComplete?.(data);

        if (data.result === "phishing") {
        toast.error("⚠️ LOGO PHISHING DETECTED!", {
          description: data.detectedBrand
            ? `Fake ${data.detectedBrand} logo identified`
            : "Suspicious logo detected",
        });
        } else if (data.result === "safe") {
        toast.success("✓ Logo appears authentic", {
          description: data.detectedBrand
            ? `${data.detectedBrand} logo verified`
            : "No phishing indicators found",
        });
        } else {
          toast.info("⚡ Logo unknown", {
            description: "Insufficient signals to verify authenticity",
          });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Image className="h-5 w-5 text-primary" />
            Logo Phishing Scanner
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

          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Image URL
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Image URL
                </label>
                <Input
                  placeholder="https://example.com/logo.png"
                  value={imageUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="bg-background/50 border-primary/30 focus:border-primary"
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div
                className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Preview */}
          {previewImage && (
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">
                Preview
              </label>
              <div className="mt-2 p-4 bg-background/50 rounded-lg border border-primary/20">
                <img
                  src={previewImage}
                  alt="Logo preview"
                  className="max-h-32 mx-auto object-contain"
                  onError={() => {
                    toast.error("Failed to load image");
                    setPreviewImage(null);
                  }}
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleScan}
            disabled={isLoading || (!imageUrl && !previewImage)}
            className="w-full"
            variant="neon"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Analyzing Logo...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                ANALYZE LOGO
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
                : result.result === "unknown"
                ? "border-warning/50 bg-warning/5"
                : "border-safe/50 bg-safe/5"
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {result.result === "phishing" ? (
                    <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
                  ) : result.result === "unknown" ? (
                    <Shield className="h-6 w-6 text-warning" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-safe" />
                  )}
                  <span
                    className={
                      result.result === "phishing"
                        ? "text-destructive"
                        : result.result === "unknown"
                        ? "text-warning"
                        : "text-safe"
                    }
                  >
                    {result.result === "phishing"
                      ? "LOGO PHISHING DETECTED"
                      : result.result === "unknown"
                      ? "LOGO UNKNOWN"
                      : "LOGO APPEARS AUTHENTIC"}
                  </span>
                </CardTitle>
                <Badge
                  variant={
                    result.result === "phishing"
                      ? "destructive"
                      : result.result === "unknown"
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
                  <span className="text-muted-foreground">
                    {result.result === "phishing" ? "Threat Level" : "Authenticity"}
                  </span>
                  <span>{result.confidence}%</span>
                </div>
                <Progress
                  value={result.confidence}
                  className={`h-3 ${
                    result.result === "phishing"
                      ? "[&>div]:bg-destructive"
                      : result.result === "unknown"
                      ? "[&>div]:bg-warning"
                      : "[&>div]:bg-safe"
                  }`}
                />
              </div>

              {result.detectedBrand && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Detected Brand: </span>
                  <Badge variant="outline" className="ml-2 capitalize">
                    {result.detectedBrand}
                  </Badge>
                </div>
              )}

              {result.threatIndicators.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-destructive">
                    Issues Detected:
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

              {result.analysisDetails?.aiAnalysis?.reasoning && (
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">AI Analysis: </span>
                    {result.analysisDetails.aiAnalysis.reasoning}
                  </p>
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
