import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CyberBackground } from "@/components/CyberBackground";
import { Navbar } from "@/components/Navbar";
import { ScanTabs } from "@/components/ScanTabs";
import { ScanResult } from "@/components/ScanResult";
import { ScanHistory } from "@/components/ScanHistory";
import { StatsCard } from "@/components/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { useScans } from "@/hooks/useScans";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { scans, isLoading, currentResult, analyzeUrl, deleteScan } = useScans(user?.id);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Handle URL passed from landing page
  useEffect(() => {
    if (location.state?.scanUrl && user) {
      analyzeUrl(location.state.scanUrl);
      // Clear the state so it doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [location.state, user]);

  const exportToCSV = () => {
    if (scans.length === 0) {
      toast.info("No scans to export");
      return;
    }

    const headers = ["URL", "Result", "Confidence", "Scanned At"];
    const rows = scans.map(scan => [
      scan.url,
      scan.result,
      `${scan.confidence}%`,
      new Date(scan.scanned_at).toISOString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `phishshield-scans-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Scans exported successfully");
  };

  // Calculate stats from scans
  const totalScans = scans.length;
  const phishingCount = scans.filter(s => s.result === "phishing").length;
  const safeCount = scans.filter(s => s.result === "safe").length;
  const suspiciousCount = scans.filter(s => s.result === "suspicious").length;

  if (!user) return null;

  return (
    <div className="min-h-screen relative">
      <CyberBackground />
      <Navbar />
      
      <main className="relative pt-28 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl font-bold mb-2">
              Threat Analysis <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">
              Real-time neural threat detection and monitoring
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <StatsCard icon={Shield} value={totalScans} label="Total Scans" delay={0.1} />
            <StatsCard icon={ShieldCheck} value={safeCount} label="Safe URLs" delay={0.2} />
            <StatsCard icon={ShieldAlert} value={phishingCount} label="Threats Found" delay={0.3} />
            <StatsCard icon={AlertTriangle} value={suspiciousCount} label="Suspicious" delay={0.4} />
          </motion.div>

          {/* Scan Tabs - URL, Email, Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <ScanTabs onUrlScan={analyzeUrl} isLoading={isLoading} userId={user?.id} />
          </motion.div>

          {/* Current Result */}
          {currentResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <ScanResult result={currentResult} onRescan={() => analyzeUrl(currentResult.url)} />
            </motion.div>
          )}

          {/* Actions Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-between items-center mb-4"
          >
            <h2 className="font-display text-xl font-semibold">Recent Scans</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </motion.div>

          {/* Scan History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ScanHistory
              scans={scans}
              onDelete={deleteScan}
              onRescan={analyzeUrl}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
