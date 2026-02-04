import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Mail, Image } from "lucide-react";
import { ScanInput } from "./ScanInput";
import { EmailScanTab } from "./EmailScanTab";
import { LogoScanTab } from "./LogoScanTab";

interface ScanTabsProps {
  onUrlScan: (url: string) => void;
  isLoading: boolean;
  userId?: string;
}

export function ScanTabs({ onUrlScan, isLoading, userId }: ScanTabsProps) {
  return (
    <Tabs defaultValue="url" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6 bg-background/50 backdrop-blur-sm border border-primary/20">
        <TabsTrigger 
          value="url" 
          className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">URL Scan</span>
          <span className="sm:hidden">URL</span>
        </TabsTrigger>
        <TabsTrigger 
          value="email" 
          className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
        >
          <Mail className="h-4 w-4" />
          <span className="hidden sm:inline">📧 Email Scan</span>
          <span className="sm:hidden">📧 Email</span>
        </TabsTrigger>
        <TabsTrigger 
          value="logo" 
          className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
        >
          <Image className="h-4 w-4" />
          <span className="hidden sm:inline">🖼️ Logo Scan</span>
          <span className="sm:hidden">🖼️ Logo</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="url">
        <ScanInput onScan={onUrlScan} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="email">
        <EmailScanTab userId={userId} />
      </TabsContent>

      <TabsContent value="logo">
        <LogoScanTab userId={userId} />
      </TabsContent>
    </Tabs>
  );
}
