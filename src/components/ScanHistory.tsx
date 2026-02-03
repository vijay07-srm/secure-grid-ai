import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, AlertTriangle, ExternalLink, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

interface Scan {
  id: string;
  url: string;
  result: "safe" | "phishing" | "suspicious";
  confidence: number;
  scanned_at: string;
}

interface ScanHistoryProps {
  scans: Scan[];
  onDelete?: (id: string) => void;
  onRescan?: (url: string) => void;
}

export function ScanHistory({ scans, onDelete, onRescan }: ScanHistoryProps) {
  const getStatusIcon = (result: string) => {
    switch (result) {
      case "safe":
        return <ShieldCheck className="h-4 w-4 text-safe" />;
      case "phishing":
        return <ShieldAlert className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = (result: string) => {
    const base = "px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider";
    switch (result) {
      case "safe":
        return `${base} badge-safe`;
      case "phishing":
        return `${base} badge-danger`;
      default:
        return `${base} badge-warning`;
    }
  };

  if (scans.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-8 rounded-xl text-center"
      >
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-lg font-semibold mb-2">No Scans Yet</h3>
        <p className="text-muted-foreground text-sm">
          Your threat analysis history will appear here
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <div className="p-4 border-b border-border/50">
        <h3 className="font-display text-lg font-semibold">Scan History</h3>
        <p className="text-sm text-muted-foreground">Your recent threat analyses</p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/30">
              <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">URL</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Confidence</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Time</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scans.map((scan, index) => (
              <motion.tr
                key={scan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-border/30 hover:bg-muted/30"
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(scan.result)}
                    <span className={getStatusBadge(scan.result)}>
                      {scan.result}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs max-w-[200px] truncate">
                  {scan.url}
                </TableCell>
                <TableCell>
                  <span className="font-display font-semibold">
                    {scan.confidence.toFixed(0)}%
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(scan.scanned_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {onRescan && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onRescan(scan.url)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(scan.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
