import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  delay?: number;
}

export function StatsCard({ icon: Icon, value, label, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="glass-card p-6 rounded-xl border border-border/50 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-display font-bold gradient-text">
            {value}
          </p>
          <p className="text-sm text-muted-foreground mt-1 uppercase tracking-wider">
            {label}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}
