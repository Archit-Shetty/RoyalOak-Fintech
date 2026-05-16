import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Send, ShieldCheck, Sparkles, BrainCircuit, Wallet, BarChart4, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const Route = createFileRoute("/advisory")({
  head: () => ({ meta: [{ title: "AI Wealth Copilot — RoyalOak Fintech" }] }),
  component: Advisory,
});

interface Holding {
  name: string;
  type: string;
  units: number;
  val: number;
  ret: number;
}

function Advisory() {
  const { user } = useAuth();
  const [userData, setUserData] = useState({ name: "User", riskProfile: "Balanced", advice: "" });
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // DYNAMIC ACCOUNT REAL CONTEXT STORAGE (ADDED returnsPct TO TYPE CONFIGURATION)
  const [portfolioMetrics, setPortfolioMetrics] = useState({
    totalValue: 0,
    invested: 0,
    todaysPl: 0,
    returnsPct: 0, // Added here to satisfy TypeScript compiler
    mfAllocation: 0,
    equityAllocation: 0,
    sipAllocation: 0
  });
  const [holdingsList, setHoldingsList] = useState<Holding[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);

  // FETCH GENUINE USER META & COMPUTE LIVE DISPERSION RATIOS FROM FIRESTORE
  useEffect(() => {
    if (!user) return;

    const fetchLiveUserContext = async () => {
      setLoadingContext(true);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        
        if (snap.exists()) {
          const data = snap.data();
          const firstname = data.name || user.displayName || "User";
          const risk = data.riskProfile || "Balanced";
          const targetAdvice = data.investmentAdvice || "Portfolio optimized for steady capital appreciation.";
          
          setUserData({
            name: firstname,
            riskProfile: risk,
            advice: targetAdvice
          });

          const portfolio = data.portfolio || {};
          const holdings: Holding[] = data.holdings || [];
          setHoldingsList(holdings);

          // Compute exact allocation weights from holdings arrays dynamically
          let mfSum = 0, stockSum = 0, sipSum = 0;
          holdings.forEach((h) => {
            if (h.type === "Equity MF") mfSum += h.val;
            if (h.type === "Stocks") stockSum += h.val;
            if (h.type === "SIPs") sipSum += h.val;
          });
          const grandTotal = mfSum + stockSum + sipSum || 1;

          const dynamicInvested = portfolio.invested || 0;
          const dynamicCurrent = portfolio.totalValue || 0;
          
          // Calculate dynamic context yield matrix percentage
          const computedPctGain = dynamicInvested > 0 
            ? parseFloat((((dynamicCurrent - dynamicInvested) / dynamicInvested) * 100).toFixed(2)) 
            : 0;

          setPortfolioMetrics({
            totalValue: dynamicCurrent,
            invested: dynamicInvested,
            todaysPl: portfolio.todaysPl || 0,
            returnsPct: computedPctGain, // Assigned cleanly here
            mfAllocation: Math.round((mfSum / grandTotal) * 100),
            equityAllocation: Math.round((stockSum / grandTotal) * 100),
            sipAllocation: Math.round((sipSum / grandTotal) * 100)
          });

          // Initialize dynamic personalized conversation greetings
          setMsgs([
            { 
              from: "ai", 
              text: `Hello ${firstname.split(' ')[0]}! I'm Arun, your wealth advisor at RoyalOak. I've pulled your live dashboard portfolio numbers and your ${risk} risk profile parameters. What financial questions or asset updates can I help you check out today?` 
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to map live system token vectors", err);
        toast.error("Ledger synchronization delay.");
      } finally {
        setLoadingContext(false);
      }
    };

    fetchLiveUserContext();
  }, [user]);

  // SYSTEM PROMPT GENERATOR: PIPES HOLISTIC METRICS DATA MANIFESTS 
  const callGeminiAI = async (userPrompt: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_KEY_HERE";
    
    if (apiKey === "YOUR_KEY_HERE") {
      toast.error("Gemini Key Missing. Please assign VITE_GEMINI_API_KEY in .env");
      return "Error: API key missing from infrastructure configurations.";
    }

    try {
      const holdingsSummary = holdingsList.length > 0 
        ? holdingsList.map(h => `- ${h.name} (${h.type}): ${h.units.toFixed(2)} units worth ₹${h.val.toLocaleString("en-IN")} with returns of ${h.ret}%`).join("\n")
        : "No active investments made yet.";

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: `You are Arun Shetty, a professional Senior Wealth Manager at RoyalOak Fintech talking directly to your client, ${userData.name}.
        
        The client has a ${userData.riskProfile} risk profile.
        
        Here is the user's REAL live portfolio data from their dashboard. Use these exact numbers to answer their questions naturally:
        - Total Invested: ₹${portfolioMetrics.invested.toLocaleString("en-IN")}
        - Total Portfolio Value: ₹${portfolioMetrics.totalValue.toLocaleString("en-IN")}
        - Total Profits/Losses: ₹${(portfolioMetrics.totalValue - portfolioMetrics.invested).toLocaleString("en-IN")}
        - Percentage Yield: ${portfolioMetrics.returnsPct}%
        - Asset Split: ${portfolioMetrics.mfAllocation}% Mutual Funds, ${portfolioMetrics.equityAllocation}% direct Equities, ${portfolioMetrics.sipAllocation}% systematic SIP plans.
        
        Current Holdings List:
        ${holdingsSummary}
        
        Respond naturally, fluidly, and conversationally as a human wealth advisor would. Do not sound mechanical, do not reuse the same introductory phrases, and do not reference that you are an AI model.`
      });

      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini engine inference crash:", error);
      return "My apologies, I ran into a connection latency error with the ledger network. Could you type that again?";
    }
  };

  const handleSend = async () => {
    if (!text.trim() || loadingContext) return;
    
    const userMessage = text;
    setMsgs((m) => [...m, { from: "user", text: userMessage }]);
    setText("");
    setIsTyping(true);

    const aiResponse = await callGeminiAI(userMessage);
    
    setIsTyping(false);
    setMsgs((m) => [...m, { from: "ai", text: aiResponse }]);
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gold-gradient grid place-items-center text-gold-foreground">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Talk to your advisor</h1>
            <p className="text-sm text-muted-foreground">Direct access to your dedicated wealth manager, backed by real-time account data.</p>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* MAIN CHAT CONSOLE */}
          <Card className="overflow-hidden lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-md shadow-elegant">
            <div className="flex h-[590px] flex-col">
              <div className="flex items-center justify-between border-b border-border bg-secondary/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-9 w-9 rounded-full bg-primary border text-primary-foreground grid place-items-center font-bold font-mono text-sm">AS</div>
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-background bg-success animate-pulse" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-semibold leading-none">Arun Shetty</div>
                    <div className="mt-1 text-[9px] uppercase tracking-wider text-success font-bold">Senior Wealth Manager</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs bg-background border-gold/30 text-gold font-bold">
                   Direct Line Live
                </Badge>
              </div>

              {/* MESSAGE FEED */}
              <div className="flex-1 space-y-4 overflow-y-auto p-6 text-sm">
                {loadingContext ? (
                  <div className="h-full flex items-center justify-center">
                     <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-gold" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground animate-pulse">Connecting secure feed...</span>
                     </div>
                  </div>
                ) : (
                  msgs.map((m, i) => (
                    <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-line ${
                        m.from === "user" 
                          ? "bg-gold-gradient text-gold-foreground rounded-tr-none font-medium shadow-md shadow-gold/5" 
                          : "bg-secondary/30 border border-border/40 rounded-tl-none text-foreground prose prose-invert max-w-none"
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-secondary/20 border text-xs text-muted-foreground rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-2">
                       <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                       Arun is typing...
                    </div>
                  </div>
                )}
              </div>

              {/* INPUT BAR */}
              <form className="flex gap-2 border-t border-border p-4 bg-card" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                <input 
                  value={text} 
                  disabled={isTyping || loadingContext}
                  onChange={(e) => setText(e.target.value)} 
                  placeholder="Ask a question about your portfolio, allocations, or market options..." 
                  className="flex-1 rounded-xl border border-border bg-secondary/10 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-gold/50 transition-all font-medium disabled:opacity-50" 
                />
                <Button type="submit" disabled={isTyping || loadingContext} className="bg-gold-gradient text-gold-foreground hover:opacity-90 rounded-xl px-5 shadow-md">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>

          {/* SIDE PANEL LEDGERS */}
          <div className="space-y-4">
            <Card className="p-6 border-gold/20 bg-gold/5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                 <Sparkles className="h-16 w-16 text-gold" />
              </div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-bold text-gold">
                <ShieldCheck className="h-3.5 w-3.5" />
                Profile Strategy
              </div>
              <div className="mt-3 font-display text-3xl font-bold text-gold-gradient tracking-tight">
                {userData.riskProfile}
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed italic">
                "{userData.advice}"
              </p>
              <Button asChild variant="outline" size="sm" className="mt-5 w-full border-gold/30 hover:bg-gold/10 text-xs font-bold">
                <Link to="/risk-assessment" search={{ onboarding: false }}>
                  Reconfigure Targets
                </Link>
              </Button>
            </Card>

            <Card className="p-6 border-border/50 bg-card/20 space-y-4">
               <h4 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-gold" /> Account Snapshot
               </h4>
               <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-secondary/20 rounded-xl border">
                     <p className="text-[9px] font-bold text-muted-foreground uppercase">Net Worth</p>
                     <p className="text-sm font-bold font-display text-foreground mt-0.5">
                       {loadingContext ? "..." : `₹${portfolioMetrics.totalValue.toLocaleString("en-IN")}`}
                     </p>
                  </div>
                  <div className="p-3 bg-secondary/20 rounded-xl border">
                     <p className="text-[9px] font-bold text-muted-foreground uppercase">Invested</p>
                     <p className="text-sm font-bold font-display text-foreground mt-0.5">
                       {loadingContext ? "..." : `₹${portfolioMetrics.invested.toLocaleString("en-IN")}`}
                     </p>
                  </div>
               </div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/20">
              <h4 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                 <BarChart4 className="h-4 w-4 text-gold" /> Asset Class Mix
              </h4>
              <div className="space-y-3 pt-1">
                 <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                       <span>Mutual Funds (Lumpsum)</span>
                       <span className="text-foreground font-bold">{portfolioMetrics.mfAllocation}%</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                       <div className="bg-gold h-full rounded-full transition-all duration-500" style={{ width: `${portfolioMetrics.mfAllocation}%` }} />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                       <span>BSE Equities</span>
                       <span className="text-foreground font-bold">{portfolioMetrics.equityAllocation}%</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                       <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${portfolioMetrics.equityAllocation}%` }} />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                       <span>Systematic Mandates (SIP)</span>
                       <span className="text-foreground font-bold">{portfolioMetrics.sipAllocation}%</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                       <div className="bg-success h-full rounded-full transition-all duration-500" style={{ width: `${portfolioMetrics.sipAllocation}%` }} />
                    </div>
                 </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}