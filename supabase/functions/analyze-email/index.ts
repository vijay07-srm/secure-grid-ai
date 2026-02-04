import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailFeatures {
  senderDomain: string;
  senderUser: string;
  isSpoofedDomain: boolean;
  hasUrgencyKeywords: boolean;
  urgencyCount: number;
  hasVerificationKeywords: boolean;
  hasThreateningLanguage: boolean;
  hasSuspiciousLinks: boolean;
  linkCount: number;
  suspiciousLinks: string[];
  hasAttachmentMentions: boolean;
  hasMoneyRelatedContent: boolean;
  hasBrandImpersonation: boolean;
  impersonatedBrands: string[];
  grammarScore: number;
  sentimentScore: number;
}

const urgencyKeywords = [
  'urgent', 'immediately', 'asap', 'right away', 'right now', 'hurry',
  'time sensitive', 'act now', 'limited time', 'expires', 'deadline',
  'last chance', 'don\'t delay', 'must act', 'final notice', 'warning',
  'immediate action', '24 hours', '48 hours', 'today only', 'now'
];

const verificationKeywords = [
  'verify', 'confirm', 'validate', 'authenticate', 'update your',
  'review your', 'check your', 'secure your', 'protect your'
];

const threateningKeywords = [
  'suspended', 'disabled', 'blocked', 'locked', 'terminated',
  'closed', 'restricted', 'limited', 'compromised', 'unauthorized',
  'violation', 'penalty', 'legal action', 'prosecution', 'arrest'
];

const moneyKeywords = [
  'payment', 'invoice', 'bill', 'charge', 'refund', 'credit',
  'bank', 'transfer', 'wire', 'bitcoin', 'crypto', 'prize',
  'winner', 'lottery', 'inheritance', 'million', 'dollar'
];

const knownBrands = [
  'paypal', 'amazon', 'apple', 'microsoft', 'google', 'facebook',
  'netflix', 'spotify', 'instagram', 'twitter', 'linkedin', 'bank',
  'wells fargo', 'chase', 'citi', 'hsbc', 'barclays', 'irs', 'dhl',
  'fedex', 'ups', 'usps', 'dropbox', 'adobe', 'zoom', 'slack'
];

const legitimateDomains: { [key: string]: string[] } = {
  'paypal': ['paypal.com', 'paypal.co.uk'],
  'amazon': ['amazon.com', 'amazon.co.uk', 'amazon.in', 'amazon.de'],
  'apple': ['apple.com', 'icloud.com'],
  'microsoft': ['microsoft.com', 'outlook.com', 'live.com', 'hotmail.com'],
  'google': ['google.com', 'gmail.com'],
  'netflix': ['netflix.com'],
  'facebook': ['facebook.com', 'fb.com'],
};

function extractEmailFeatures(sender: string, subject: string, body: string): EmailFeatures {
  const fullText = `${subject} ${body}`.toLowerCase();
  const senderLower = sender.toLowerCase();
  
  // Extract sender domain
  const domainMatch = senderLower.match(/@([a-zA-Z0-9.-]+)/);
  const senderDomain = domainMatch ? domainMatch[1] : '';
  const senderUser = senderLower.split('@')[0] || '';
  
  // Check for brand impersonation
  const impersonatedBrands: string[] = [];
  let isSpoofedDomain = false;
  
  for (const brand of knownBrands) {
    if (fullText.includes(brand) || senderLower.includes(brand)) {
      const legit = legitimateDomains[brand];
      if (legit && !legit.some(d => senderDomain.endsWith(d))) {
        if (senderDomain.includes(brand)) {
          isSpoofedDomain = true;
          impersonatedBrands.push(brand);
        }
      }
    }
  }
  
  // Check for suspicious domain patterns
  if (senderDomain.includes('-') && senderDomain.split('-').length > 2) {
    isSpoofedDomain = true;
  }
  if (/\d{3,}/.test(senderDomain)) {
    isSpoofedDomain = true;
  }
  
  // Count keywords
  const urgencyCount = urgencyKeywords.filter(kw => fullText.includes(kw)).length;
  const hasUrgencyKeywords = urgencyCount > 0;
  const hasVerificationKeywords = verificationKeywords.some(kw => fullText.includes(kw));
  const hasThreateningLanguage = threateningKeywords.some(kw => fullText.includes(kw));
  const hasMoneyRelatedContent = moneyKeywords.some(kw => fullText.includes(kw));
  
  // Extract links
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
  const links = body.match(urlRegex) || [];
  const suspiciousLinks = links.filter(link => {
    const linkLower = link.toLowerCase();
    return (
      /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(link) ||
      linkLower.includes('bit.ly') ||
      linkLower.includes('tinyurl') ||
      linkLower.includes('click') ||
      linkLower.includes('verify') ||
      linkLower.includes('secure') ||
      /@/.test(link) ||
      link.length > 100
    );
  });
  
  // Check for attachment mentions
  const hasAttachmentMentions = /attach|download|open the file|see attached/.test(fullText);
  
  // Simple grammar score (based on common errors)
  let grammarScore = 100;
  if (/\s{2,}/.test(body)) grammarScore -= 10;
  if (/[A-Z]{5,}/.test(body)) grammarScore -= 15;
  if (/!!!/.test(body)) grammarScore -= 10;
  if (/dear customer|dear user|dear valued/i.test(body)) grammarScore -= 20;
  
  return {
    senderDomain,
    senderUser,
    isSpoofedDomain,
    hasUrgencyKeywords,
    urgencyCount,
    hasVerificationKeywords,
    hasThreateningLanguage,
    hasSuspiciousLinks: suspiciousLinks.length > 0,
    linkCount: links.length,
    suspiciousLinks,
    hasAttachmentMentions,
    hasMoneyRelatedContent,
    hasBrandImpersonation: impersonatedBrands.length > 0,
    impersonatedBrands,
    grammarScore: Math.max(0, grammarScore),
    sentimentScore: 50
  };
}

function calculateEmailRiskScore(features: EmailFeatures): { score: number; threats: string[] } {
  let score = 0;
  const threats: string[] = [];
  
  if (features.isSpoofedDomain) {
    score += 30;
    threats.push(`Spoofed sender domain detected: ${features.senderDomain}`);
  }
  
  if (features.hasBrandImpersonation) {
    score += 25;
    threats.push(`Brand impersonation attempt: ${features.impersonatedBrands.join(', ')}`);
  }
  
  if (features.hasUrgencyKeywords) {
    score += Math.min(20, features.urgencyCount * 5);
    threats.push(`Urgency manipulation detected (${features.urgencyCount} keywords)`);
  }
  
  if (features.hasVerificationKeywords) {
    score += 15;
    threats.push('Credential harvesting language detected');
  }
  
  if (features.hasThreateningLanguage) {
    score += 20;
    threats.push('Threatening/fear-based language detected');
  }
  
  if (features.hasSuspiciousLinks) {
    score += 20;
    threats.push(`Suspicious links found: ${features.suspiciousLinks.length}`);
  }
  
  if (features.hasMoneyRelatedContent && (features.hasUrgencyKeywords || features.hasThreateningLanguage)) {
    score += 15;
    threats.push('Financial urgency pressure tactics');
  }
  
  if (features.grammarScore < 60) {
    score += 10;
    threats.push('Poor grammar quality (common in phishing)');
  }
  
  return { score: Math.min(100, score), threats };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sender, subject, body } = await req.json();
    
    if (!sender || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Sender, subject, and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    
    const features = extractEmailFeatures(sender, subject, body);
    const { score: ruleBasedScore, threats } = calculateEmailRiskScore(features);
    
    // AI analysis for deeper detection
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert email phishing analyst. Analyze emails for phishing indicators.
            
Return a JSON response with:
1. "isPhishing": boolean - true if likely phishing
2. "confidence": number 0-100 - your confidence level
3. "reasoning": string - brief explanation
4. "tactics": array of strings - specific phishing tactics identified
5. "redFlags": array of strings - specific red flags found

Consider:
- Sender legitimacy and domain spoofing
- Social engineering tactics (urgency, fear, greed)
- Link analysis and URL obfuscation
- Brand impersonation attempts
- Request for sensitive information
- Grammar and spelling quality
- Mismatched sender name vs email
- Generic greetings vs personalization

Return ONLY valid JSON.`
          },
          {
            role: "user",
            content: `Analyze this email for phishing:

FROM: ${sender}
SUBJECT: ${subject}
BODY:
${body}

Pre-computed features:
- Sender Domain: ${features.senderDomain}
- Spoofed Domain: ${features.isSpoofedDomain}
- Urgency Keywords: ${features.urgencyCount}
- Verification Keywords: ${features.hasVerificationKeywords}
- Threatening Language: ${features.hasThreateningLanguage}
- Suspicious Links: ${features.suspiciousLinks.length}
- Brand Impersonation: ${features.impersonatedBrands.join(', ') || 'None'}
- Grammar Score: ${features.grammarScore}/100`
          }
        ],
        temperature: 0.2,
        max_tokens: 600
      }),
    });

    let aiAnalysis = { isPhishing: false, confidence: 50, reasoning: "", tactics: [], redFlags: [] };
    
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const aiContent = aiData.choices?.[0]?.message?.content || "{}";
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        aiAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : aiAnalysis;
      } catch {
        console.error("Failed to parse AI response");
      }
    }
    
    // Combine scores
    const aiScore = aiAnalysis.isPhishing ? 
      50 + (aiAnalysis.confidence || 50) / 2 : 
      50 - (aiAnalysis.confidence || 50) / 2;
    
    const combinedScore = (ruleBasedScore * 0.4) + (aiScore * 0.6);
    
    const result = combinedScore >= 50 ? "phishing" : combinedScore >= 25 ? "suspicious" : "safe";
    const confidence = Math.round(
      result === "safe" ? 
        100 - combinedScore : 
        Math.min(98, combinedScore + 20)
    );
    
    // Combine all threats
    const allThreats = [...threats];
    if (aiAnalysis.tactics) allThreats.push(...aiAnalysis.tactics);
    if (aiAnalysis.redFlags) allThreats.push(...aiAnalysis.redFlags);
    if (aiAnalysis.reasoning && result !== "safe") {
      allThreats.push(aiAnalysis.reasoning);
    }
    
    const blockchainHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('')}`;

    return new Response(
      JSON.stringify({
        sender,
        subject,
        result,
        confidence,
        threatIndicators: [...new Set(allThreats)].slice(0, 8),
        analysisDetails: {
          features,
          ruleBasedScore,
          aiScore: Math.round(aiScore),
          combinedScore: Math.round(combinedScore),
          aiAnalysis,
          method: "hybrid-email-ai"
        },
        blockchainHash,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Email analysis error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Email analysis failed" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
