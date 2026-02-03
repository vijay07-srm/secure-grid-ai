import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, ShieldAlert, Zap, Link2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScanInput } from "@/components/ScanInput";
import { CyberBackground } from "@/components/CyberBackground";
import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { AuthModal } from "@/components/AuthModal";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleScan = async (url: string) => {
    if (!user) {
      setIsAuthOpen(true);
      toast.info("Sign in to analyze URLs and save your scan history");
      return;
    }
    
    // Navigate to dashboard and trigger scan
    navigate("/dashboard", { state: { scanUrl: url } });
  };

  const features = [
    {
      icon: Shield,
      title: "Neural Threat Analysis",
      description: "AI-powered detection using advanced machine learning models trained on millions of phishing samples"
    },
    {
      icon: Link2,
      title: "Deep URL Inspection",
      description: "30+ URL features analyzed including entropy, structure anomalies, and typosquatting detection"
    },
    {
      icon: Activity,
      title: "Real-Time Monitoring",
      description: "Instant threat detection with live dashboard updates and comprehensive scan history"
    }
  ];

  return (
    <div className="min-h-screen relative">
      <CyberBackground />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-primary/30 mb-8"
          >
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Blockchain-Verified Threat Intelligence</span>
          </motion.div>
          
          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="gradient-text">Real-Time Neural</span>
            <br />
            <span className="text-foreground">Threat Analysis</span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
          >
            Advanced AI phishing detection powered by neural networks and blockchain-verified threat intelligence. Protect yourself from sophisticated cyber attacks.
          </motion.p>
          
          {/* Scan Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto mb-16"
          >
            <ScanInput onScan={handleScan} isLoading={isScanning} size="large" />
            <p className="text-xs text-muted-foreground mt-4">
              Enter any URL to analyze for phishing threats, malware, and suspicious activity
            </p>
          </motion.div>
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            <StatsCard icon={Shield} value="10M+" label="Threats Blocked" delay={0.5} />
            <StatsCard icon={ShieldCheck} value="99.7%" label="Detection Rate" delay={0.6} />
            <StatsCard icon={Zap} value="<100ms" label="Response Time" delay={0.7} />
            <StatsCard icon={ShieldAlert} value="24/7" label="Monitoring" delay={0.8} />
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Cutting-Edge <span className="gradient-text">Protection</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Enterprise-grade security powered by the latest in AI and blockchain technology
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="glass-card p-8 rounded-2xl border border-border/50 hover:border-primary/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="relative py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto glass-card p-12 rounded-3xl border border-primary/20 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 hero-gradient" />
          
          <div className="relative z-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Start Protecting Yourself <span className="gradient-text">Today</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of users who trust PhishShield AI to protect them from the latest cyber threats
            </p>
            
            {user ? (
              <Button variant="neon" size="xl" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <Button variant="neon" size="xl" onClick={() => setIsAuthOpen(true)}>
                Access Terminal
              </Button>
            )}
          </div>
        </motion.div>
      </section>
      
      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-border/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-display">PhishShield AI</span>
          </div>
          <p>© 2026 PhishShield AI. Blockchain & Cyber Security Hackathon</p>
        </div>
      </footer>
      
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
          navigate("/dashboard");
        }}
      />
    </div>
  );
};

export default Index;
