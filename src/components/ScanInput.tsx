import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ScanInputProps {
  onScan: (url: string) => void;
  isLoading: boolean;
  size?: "default" | "large";
}

export function ScanInput({ onScan, isLoading, size = "default" }: ScanInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onScan(url.trim());
    }
  };

  const isLarge = size === "large";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <motion.div 
        className={`relative flex items-center gap-2 ${isLarge ? 'p-2' : 'p-1.5'} glass-card rounded-2xl`}
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {/* Animated border */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-50"
          style={{
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))",
            backgroundSize: "200% 100%",
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Inner container */}
        <div className={`relative flex flex-1 items-center gap-3 bg-background/95 ${isLarge ? 'p-3' : 'p-2'} rounded-xl`}>
          <Shield className={`${isLarge ? 'h-6 w-6' : 'h-5 w-5'} text-primary shrink-0`} />
          
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to analyze for threats..."
            className={`flex-1 border-0 bg-transparent focus-visible:ring-0 ${isLarge ? 'text-lg h-12' : 'text-base h-10'} placeholder:text-muted-foreground/50`}
            disabled={isLoading}
          />
          
          <Button
            type="submit"
            variant="neon"
            size={isLarge ? "lg" : "default"}
            disabled={!url.trim() || isLoading}
            className="shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                <span className="hidden sm:inline">Analyzing</span>
              </>
            ) : (
              <>
                <Search />
                <span className="hidden sm:inline">Scan</span>
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </form>
  );
}
