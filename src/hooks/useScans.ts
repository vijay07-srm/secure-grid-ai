import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ScanResultData } from "@/components/ScanResult";

interface Scan {
  id: string;
  url: string;
  result: "safe" | "phishing" | "suspicious";
  confidence: number;
  threat_indicators: string[];
  analysis_details: Record<string, unknown>;
  blockchain_hash: string | null;
  scanned_at: string;
}

export function useScans(userId: string | undefined) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScanResultData | null>(null);

  useEffect(() => {
    if (userId) {
      fetchScans();
      subscribeToScans();
    }
  }, [userId]);

  const fetchScans = async () => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .eq("user_id", userId)
      .order("scanned_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching scans:", error);
      return;
    }

    setScans(data.map(scan => ({
      ...scan,
      result: scan.result as "safe" | "phishing" | "suspicious",
      threat_indicators: (scan.threat_indicators as string[]) || [],
      analysis_details: (scan.analysis_details as Record<string, unknown>) || {}
    })));
  };

  const subscribeToScans = () => {
    const channel = supabase
      .channel("scans-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scans",
        },
        () => {
          fetchScans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const analyzeUrl = async (url: string) => {
    if (!userId) {
      toast.error("Please sign in to scan URLs");
      return;
    }

    setIsLoading(true);
    setCurrentResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ url }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      const result: ScanResultData = await response.json();
      setCurrentResult(result);

      // Save to database
      const { error: saveError } = await supabase.from("scans").insert([{
        user_id: userId,
        url: result.url,
        result: result.result,
        confidence: result.confidence,
        threat_indicators: result.threatIndicators as unknown as null,
        analysis_details: JSON.parse(JSON.stringify(result.analysisDetails)),
        blockchain_hash: result.blockchainHash,
      }]);

      if (saveError) {
        console.error("Error saving scan:", saveError);
      }

      // Refresh scans list
      fetchScans();

      if (result.result === "phishing") {
        toast.error("⚠️ Phishing threat detected!", {
          description: "This URL has been flagged as malicious",
        });
      } else if (result.result === "suspicious") {
        toast.warning("⚡ Suspicious activity detected", {
          description: "Proceed with caution",
        });
      } else {
        toast.success("✓ URL verified safe", {
          description: "No threats detected",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteScan = async (id: string) => {
    const { error } = await supabase
      .from("scans")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to delete scan");
      return;
    }

    setScans((prev) => prev.filter((s) => s.id !== id));
    toast.success("Scan deleted");
  };

  return {
    scans,
    isLoading,
    currentResult,
    analyzeUrl,
    deleteScan,
    refreshScans: fetchScans,
  };
}
