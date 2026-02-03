import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink, Copy, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

export interface ScanResultData {
  url: string;
  result: "safe" | "phishing" | "suspicious";
  confidence: number;
  threatIndicators: string[];
  analysisDetails: {
    features?: Record<string, unknown>;
    ruleBasedScore?: number;
    aiScore?: number;
    combinedScore?: number;
    aiAnalysis?: {
      reasoning?: string;
    };
    method?: string;
  };
  blockchainHash?: string;
  timestamp?: string;
}

interface ScanResultProps {
  result: ScanResultData | null;
  onRescan?: () => void;
}

export function ScanResult({ result, onRescan }: ScanResultProps) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const copyHash = () => {
    if (result.blockchainHash) {
      navigator.clipboard.writeText(result.blockchainHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusConfig = () => {
    switch (result.result) {
      case "safe":
        return {
          icon: ShieldCheck,
          title: "URL VERIFIED SAFE",
          subtitle: "No threats detected by neural analysis",
          color: "text-safe",
          bgClass: "safe-glow",
          borderClass: "border-safe/30",
          progressColor: "bg-safe",
        };
      case "phishing":
        return {
          icon: ShieldAlert,
          title: "PHISHING THREAT DETECTED",
          subtitle: "High-risk indicators identified",
          color: "text-destructive",
          bgClass: "danger-glow",
          borderClass: "border-destructive/30",
          progressColor: "bg-destructive",
        };
      case "suspicious":
        return {
          icon: AlertTriangle,
          title: "SUSPICIOUS ACTIVITY",
          subtitle: "Proceed with caution",
          color: "text-warning",
          bgClass: "",
          borderClass: "border-warning/30",
          progressColor: "bg-warning",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={result.url + result.result}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`glass-card p-6 rounded-2xl border ${config.borderClass} ${config.bgClass}`}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            <Icon className={`h-12 w-12 ${config.color}`} />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-display text-xl font-bold ${config.color} tracking-wider`}>
              {config.title}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {config.subtitle}
            </p>
          </div>

          <div className="text-right">
            <div className={`font-display text-3xl font-bold ${config.color}`}>
              {result.confidence.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Confidence
            </div>
          </div>
        </div>

        {/* URL Display */}
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg mb-4">
          <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-mono truncate flex-1">{result.url}</span>
          <Button variant="ghost" size="icon" asChild className="shrink-0 h-8 w-8">
            <a href={result.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        {/* Confidence Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Threat Level Analysis</span>
            <span>{result.analysisDetails.method === "hybrid-ai" ? "AI + Rule-Based" : "Rule-Based"}</span>
          </div>
          <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.confidence}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className={`absolute inset-y-0 left-0 ${config.progressColor} rounded-full`}
            />
          </div>
        </div>

        {/* Threat Indicators */}
        {result.threatIndicators.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-display uppercase tracking-wider text-muted-foreground mb-3">
              Threat Indicators
            </h4>
            <ul className="space-y-2">
              {result.threatIndicators.slice(0, 5).map((threat, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${config.color}`} />
                  <span className="text-foreground/90">{threat}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {/* Blockchain Hash */}
        {result.blockchainHash && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-display uppercase tracking-wider text-primary">
                Blockchain Verified
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={copyHash}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
            <p className="font-mono text-xs text-muted-foreground truncate">
              {result.blockchainHash}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {onRescan && (
            <Button variant="outline" onClick={onRescan} className="flex-1">
              Scan Again
            </Button>
          )}
          <Button
            variant={result.result === "safe" ? "safe" : "danger"}
            className="flex-1"
            asChild
          >
            <a 
              href={result.result === "safe" ? result.url : "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => result.result !== "safe" && e.preventDefault()}
            >
              {result.result === "safe" ? "Visit Safely" : "Do Not Visit"}
            </a>
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
