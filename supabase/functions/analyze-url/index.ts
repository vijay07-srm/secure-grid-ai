import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UrlFeatures {
  length: number;
  numDots: number;
  numHyphens: number;
  numUnderscores: number;
  numSlashes: number;
  numDigits: number;
  numAtSymbols: number;
  hasHttps: boolean;
  hasIpAddress: boolean;
  hasSuspiciousTld: boolean;
  hasSuspiciousKeywords: boolean;
  hasEncodedChars: boolean;
  domainLength: number;
  pathLength: number;
  queryLength: number;
  numSubdomains: number;
  hasPortNumber: boolean;
  suspiciousKeywords: string[];
  entropy: number;
  consonantRatio: number;
  digitRatio: number;
}

function extractUrlFeatures(url: string): UrlFeatures {
  const suspiciousKeywords = [
    'login', 'signin', 'verify', 'secure', 'account', 'update', 'confirm',
    'banking', 'password', 'credential', 'suspended', 'unusual', 'alert',
    'verify', 'wallet', 'paypal', 'apple', 'microsoft', 'google', 'facebook',
    'amazon', 'netflix', 'support', 'help', 'service', 'billing', 'payment',
    'authenticate', 'validation', 'security', 'urgent', 'immediately', 'action',
    'required', 'expire', 'limited', 'restore', 'unlock', 'reactivate'
  ];
  
  const suspiciousTlds = [
    '.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.pw', '.cc',
    '.club', '.online', '.site', '.website', '.space', '.icu', '.buzz'
  ];
  
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return {
      length: url.length,
      numDots: (url.match(/\./g) || []).length,
      numHyphens: (url.match(/-/g) || []).length,
      numUnderscores: (url.match(/_/g) || []).length,
      numSlashes: (url.match(/\//g) || []).length,
      numDigits: (url.match(/\d/g) || []).length,
      numAtSymbols: (url.match(/@/g) || []).length,
      hasHttps: false,
      hasIpAddress: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url),
      hasSuspiciousTld: suspiciousTlds.some(tld => url.toLowerCase().includes(tld)),
      hasSuspiciousKeywords: suspiciousKeywords.some(kw => url.toLowerCase().includes(kw)),
      hasEncodedChars: /%[0-9a-fA-F]{2}/.test(url),
      domainLength: 0,
      pathLength: 0,
      queryLength: 0,
      numSubdomains: 0,
      hasPortNumber: false,
      suspiciousKeywords: suspiciousKeywords.filter(kw => url.toLowerCase().includes(kw)),
      entropy: calculateEntropy(url),
      consonantRatio: calculateConsonantRatio(url),
      digitRatio: (url.match(/\d/g) || []).length / url.length,
    };
  }
  
  const hostname = parsedUrl.hostname;
  const path = parsedUrl.pathname;
  const query = parsedUrl.search;
  const subdomains = hostname.split('.').length - 2;
  
  const foundKeywords = suspiciousKeywords.filter(kw => 
    url.toLowerCase().includes(kw)
  );
  
  return {
    length: url.length,
    numDots: (url.match(/\./g) || []).length,
    numHyphens: (url.match(/-/g) || []).length,
    numUnderscores: (url.match(/_/g) || []).length,
    numSlashes: (url.match(/\//g) || []).length,
    numDigits: (url.match(/\d/g) || []).length,
    numAtSymbols: (url.match(/@/g) || []).length,
    hasHttps: parsedUrl.protocol === 'https:',
    hasIpAddress: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(hostname),
    hasSuspiciousTld: suspiciousTlds.some(tld => hostname.toLowerCase().endsWith(tld)),
    hasSuspiciousKeywords: foundKeywords.length > 0,
    hasEncodedChars: /%[0-9a-fA-F]{2}/.test(url),
    domainLength: hostname.length,
    pathLength: path.length,
    queryLength: query.length,
    numSubdomains: Math.max(0, subdomains),
    hasPortNumber: parsedUrl.port !== '',
    suspiciousKeywords: foundKeywords,
    entropy: calculateEntropy(url),
    consonantRatio: calculateConsonantRatio(hostname),
    digitRatio: (url.match(/\d/g) || []).length / url.length,
  };
}

function calculateEntropy(str: string): number {
  const freq: { [key: string]: number } = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  let entropy = 0;
  const len = str.length;
  for (const char in freq) {
    const p = freq[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function calculateConsonantRatio(str: string): number {
  const consonants = str.match(/[bcdfghjklmnpqrstvwxyz]/gi) || [];
  const letters = str.match(/[a-z]/gi) || [];
  return letters.length > 0 ? consonants.length / letters.length : 0;
}

function calculateRiskScore(features: UrlFeatures): { score: number; threats: string[] } {
  let score = 0;
  const threats: string[] = [];
  
  // IP address instead of domain - high risk
  if (features.hasIpAddress) {
    score += 25;
    threats.push("IP address used instead of domain name");
  }
  
  // No HTTPS - medium risk
  if (!features.hasHttps) {
    score += 10;
    threats.push("Insecure HTTP connection");
  }
  
  // Suspicious TLD - high risk
  if (features.hasSuspiciousTld) {
    score += 20;
    threats.push("Suspicious top-level domain detected");
  }
  
  // Suspicious keywords - high risk
  if (features.hasSuspiciousKeywords) {
    score += Math.min(25, features.suspiciousKeywords.length * 8);
    threats.push(`Phishing keywords detected: ${features.suspiciousKeywords.slice(0, 3).join(', ')}`);
  }
  
  // URL length - suspicious if very long
  if (features.length > 100) {
    score += Math.min(15, (features.length - 100) / 20 * 5);
    threats.push("Abnormally long URL");
  }
  
  // Many subdomains - suspicious
  if (features.numSubdomains > 3) {
    score += Math.min(15, (features.numSubdomains - 3) * 5);
    threats.push("Multiple subdomain levels detected");
  }
  
  // Many hyphens in domain - suspicious
  if (features.numHyphens > 3) {
    score += Math.min(10, (features.numHyphens - 3) * 3);
    threats.push("Excessive hyphens in URL");
  }
  
  // @ symbol - high risk (URL obfuscation)
  if (features.numAtSymbols > 0) {
    score += 20;
    threats.push("URL contains @ symbol (potential redirect attack)");
  }
  
  // Encoded characters - medium risk
  if (features.hasEncodedChars) {
    score += 10;
    threats.push("URL contains encoded characters");
  }
  
  // Port number - suspicious
  if (features.hasPortNumber) {
    score += 15;
    threats.push("Non-standard port number in URL");
  }
  
  // High entropy - potentially randomized domain
  if (features.entropy > 4.5) {
    score += 10;
    threats.push("High entropy domain (potentially auto-generated)");
  }
  
  // High digit ratio - suspicious
  if (features.digitRatio > 0.3) {
    score += 10;
    threats.push("High ratio of digits in URL");
  }
  
  return { score: Math.min(100, score), threats };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    
    // Extract URL features for rule-based analysis
    const features = extractUrlFeatures(url);
    const { score: ruleBasedScore, threats } = calculateRiskScore(features);
    
    // Use AI for deeper analysis
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
            content: `You are a cybersecurity expert specializing in phishing detection. Analyze URLs for phishing indicators.
            
Your task is to analyze the given URL and return a JSON response with:
1. "isPhishing": boolean - true if likely phishing, false if likely safe
2. "confidence": number between 0-100 - how confident you are
3. "reasoning": string - brief explanation of your analysis
4. "additionalThreats": array of strings - any additional threats you detected

Consider these factors:
- Domain reputation and similarity to known brands (typosquatting)
- URL structure anomalies
- Presence of suspicious patterns
- Known phishing techniques (homograph attacks, subdomain abuse)
- Brand impersonation attempts

Be thorough but concise. Return ONLY valid JSON.`
          },
          {
            role: "user",
            content: `Analyze this URL for phishing threats: ${url}
            
Pre-computed features:
- Length: ${features.length}
- Has HTTPS: ${features.hasHttps}
- IP Address: ${features.hasIpAddress}
- Suspicious TLD: ${features.hasSuspiciousTld}
- Suspicious Keywords: ${features.suspiciousKeywords.join(', ')}
- Subdomains: ${features.numSubdomains}
- Entropy: ${features.entropy.toFixed(2)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", aiResponse.status);
      // Fall back to rule-based only
      const result = ruleBasedScore >= 50 ? "phishing" : ruleBasedScore >= 25 ? "suspicious" : "safe";
      
      return new Response(
        JSON.stringify({
          url,
          result,
          confidence: 100 - Math.abs(50 - ruleBasedScore),
          threatIndicators: threats,
          analysisDetails: {
            features,
            ruleBasedScore,
            aiAnalysis: null,
            method: "rule-based"
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "{}";
    
    let aiAnalysis;
    try {
      // Extract JSON from response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      aiAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      aiAnalysis = { isPhishing: false, confidence: 50, reasoning: "Unable to parse AI response" };
    }
    
    // Combine rule-based and AI analysis
    const aiScore = aiAnalysis.isPhishing ? 
      50 + (aiAnalysis.confidence || 50) / 2 : 
      50 - (aiAnalysis.confidence || 50) / 2;
    
    const combinedScore = (ruleBasedScore * 0.4) + (aiScore * 0.6);
    const finalConfidence = Math.round((ruleBasedScore > 20 || aiAnalysis.isPhishing) ? 
      Math.max(combinedScore, aiAnalysis.confidence || 70) : 
      Math.min(100 - combinedScore, 95));
    
    const result = combinedScore >= 50 ? "phishing" : combinedScore >= 25 ? "suspicious" : "safe";
    
    // Combine threats
    const allThreats = [...threats];
    if (aiAnalysis.additionalThreats) {
      allThreats.push(...aiAnalysis.additionalThreats);
    }
    if (aiAnalysis.reasoning && result !== "safe") {
      allThreats.push(aiAnalysis.reasoning);
    }
    
    // Generate blockchain hash (simulated for demo)
    const blockchainHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('')}`;

    return new Response(
      JSON.stringify({
        url,
        result,
        confidence: result === "safe" ? finalConfidence : 100 - finalConfidence + 50,
        threatIndicators: [...new Set(allThreats)],
        analysisDetails: {
          features,
          ruleBasedScore,
          aiScore: Math.round(aiScore),
          combinedScore: Math.round(combinedScore),
          aiAnalysis,
          method: "hybrid-ai"
        },
        blockchainHash,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Analysis failed" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
