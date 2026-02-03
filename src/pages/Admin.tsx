import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Users, Activity, Clock, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CyberBackground } from "@/components/CyberBackground";
import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface Scan {
  id: string;
  user_id: string;
  url: string;
  result: string;
  confidence: number;
  scanned_at: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allScans, setAllScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            checkAdminAndLoad(session.user.id);
          }, 0);
        } else {
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminAndLoad(session.user.id);
      } else {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminAndLoad = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    if (data?.role !== "admin") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard");
      return;
    }
    
    setIsAdmin(true);
    loadData();
  };

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      // Load profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Load all scans
      const { data: scansData, error: scansError } = await supabase
        .from("scans")
        .select("*")
        .order("scanned_at", { ascending: false })
        .limit(100);
      
      if (scansError) throw scansError;
      setAllScans(scansData || []);
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!isAdmin) return;

    const scansChannel = supabase
      .channel("admin-scans")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scans" },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scansChannel);
    };
  }, [isAdmin]);

  const exportUsers = () => {
    const headers = ["Email", "Display Name", "Created At", "Last Sign In"];
    const rows = profiles.map(p => [
      p.email,
      p.display_name || "N/A",
      new Date(p.created_at).toISOString(),
      p.last_sign_in_at ? new Date(p.last_sign_in_at).toISOString() : "N/A"
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `phishshield-users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Users exported");
  };

  const totalUsers = profiles.length;
  const totalScans = allScans.length;
  const phishingDetected = allScans.filter(s => s.result === "phishing").length;
  const todayScans = allScans.filter(s => 
    new Date(s.scanned_at).toDateString() === new Date().toDateString()
  ).length;

  const getUserEmail = (userId: string) => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.email || userId.slice(0, 8);
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen relative">
      <CyberBackground />
      <Navbar />
      
      <main className="relative pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h1 className="font-display text-3xl font-bold">
                Admin <span className="gradient-text">Control Center</span>
              </h1>
            </div>
            <p className="text-muted-foreground">
              Monitor all users, scans, and system activity in real-time
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <StatsCard icon={Users} value={totalUsers} label="Total Users" delay={0.1} />
            <StatsCard icon={Activity} value={totalScans} label="Total Scans" delay={0.2} />
            <StatsCard icon={Shield} value={phishingDetected} label="Threats Found" delay={0.3} />
            <StatsCard icon={Clock} value={todayScans} label="Today's Scans" delay={0.4} />
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-between items-center mb-4"
          >
            <h2 className="font-display text-xl font-semibold">All Users</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportUsers}>
                <Download className="h-4 w-4 mr-2" />
                Export Users
              </Button>
            </div>
          </motion.div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl overflow-hidden mb-8"
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/30">
                  <TableHead className="text-xs uppercase tracking-wider">Email</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Display Name</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Joined</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Last Active</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Scans</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile, index) => {
                  const userScans = allScans.filter(s => s.user_id === profile.user_id).length;
                  return (
                    <motion.tr
                      key={profile.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="border-border/30 hover:bg-muted/30"
                    >
                      <TableCell className="font-mono text-sm">{profile.email}</TableCell>
                      <TableCell>{profile.display_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {profile.last_sign_in_at 
                          ? formatDistanceToNow(new Date(profile.last_sign_in_at), { addSuffix: true })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <span className="font-display font-semibold">{userScans}</span>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </motion.div>

          {/* Recent Scans */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-4"
          >
            <h2 className="font-display text-xl font-semibold">Recent Scans (All Users)</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-xl overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/30">
                  <TableHead className="text-xs uppercase tracking-wider">User</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">URL</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Result</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Confidence</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allScans.slice(0, 20).map((scan, index) => (
                  <motion.tr
                    key={scan.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.03 }}
                    className="border-border/30 hover:bg-muted/30"
                  >
                    <TableCell className="font-mono text-xs">
                      {getUserEmail(scan.user_id)}
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate">
                      {scan.url}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                        scan.result === "safe" ? "badge-safe" :
                        scan.result === "phishing" ? "badge-danger" : "badge-warning"
                      }`}>
                        {scan.result}
                      </span>
                    </TableCell>
                    <TableCell className="font-display font-semibold">
                      {scan.confidence.toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(scan.scanned_at), { addSuffix: true })}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
