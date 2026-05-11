import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Send, User as UserIcon, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/advisory")({
  head: () => ({ meta: [{ title: "Advisory & Chat — RoyalOak Fintech" }] }),
  component: Advisory,
});

function Advisory() {
  const { user } = useAuth();
  const [userData, setUserData] = useState({ name: "User", riskProfile: "Not Set", advice: "" });
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");

  // Fetch real user data on load
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUserData({
          name: data.name || user.displayName || "User",
          riskProfile: data.riskProfile || "Not Set",
          advice: data.investmentAdvice || "Complete your assessment to see target returns."
        });

        // Initialize greeting with real name
        setMsgs([
          { 
            from: "advisor", 
            text: `Hi ${data.name?.split(' ')[0] || "there"} 👋 I'm Archit from RoyalOak. How can I help with your ${data.riskProfile || ""} portfolio today?` 
          },
        ]);
      }
    };

    fetchUserData();
  }, [user]);

  const send = () => {
    if (!text.trim()) return;
    const newUserMsg = { from: "user", text };
    setMsgs((m) => [...m, newUserMsg]);
    setText("");

    // Simulate Advisor response based on real profile
    setTimeout(() => {
      let reply = "";
      if (userData.riskProfile === "Aggressive") {
        reply = "Looking at your Aggressive profile, I recommend increasing exposure to our Mid-cap Equity basket for higher alpha. Shall I show you the breakdown?";
      } else if (userData.riskProfile === "Conservative") {
        reply = "Since you prefer a Conservative approach, your current Debt fund allocation is perfect. I noticed a slight dip in Bond yields; want to see some alternatives?";
      } else {
        reply = `Great question—based on your ${userData.riskProfile} profile, I'd suggest reviewing your current allocation. Want me to share a rebalancing plan?`;
      }
      
      setMsgs((m) => [...m, { from: "advisor", text: reply }]);
    }, 900);
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-4xl font-bold tracking-tight">Talk to your advisor</h1>
        <p className="mt-2 text-muted-foreground">Direct access to your dedicated wealth manager.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="overflow-hidden lg:col-span-2 border-border/50 shadow-elegant">
            <div className="flex h-[550px] flex-col">
              <div className="flex items-center gap-3 border-b border-border bg-secondary/20 p-4">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gold-gradient grid place-items-center text-gold-foreground font-bold">A</div>
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-success" />
                </div>
                <div>
                  <div className="font-display text-base font-semibold leading-none">Archit Shetty</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Senior Wealth Manager</div>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-6 scrollbar-hide">
                {msgs.map((m, i) => (
                  <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.from === "user" 
                        ? "bg-gold-gradient text-gold-foreground rounded-tr-none" 
                        : "bg-secondary/50 border border-border/40 rounded-tl-none"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <form className="flex gap-2 border-t border-border p-4 bg-card" onSubmit={(e) => { e.preventDefault(); send(); }}>
                <input 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  placeholder="Type your message..." 
                  className="flex-1 rounded-xl border border-border bg-secondary/20 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-gold/50 transition-all" 
                />
                <Button type="submit" className="bg-gold-gradient text-gold-foreground hover:opacity-90 rounded-xl px-5">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-6 border-gold/20 bg-gold/5 shadow-sm">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-bold text-gold">
                <ShieldCheck className="h-3.5 w-3.5" />
                Your Strategy
              </div>
              <div className="mt-3 font-display text-3xl font-bold text-gold-gradient tracking-tight">
                {userData.riskProfile}
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed italic">
                "{userData.advice}"
              </p>
              <Button asChild variant="outline" size="sm" className="mt-6 w-full border-gold/30 hover:bg-gold/10">
                <Link 
                  to="/risk-assessment" 
                  search={{ onboarding: false }} // Added this line
                >
                  Retake Assessment
                </Link>
              </Button>
            </Card>

            <Card className="p-6 border-border/50">
              <div className="font-display text-xl font-semibold">Book a 1-on-1</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Schedule a private video session to discuss tax-loss harvesting or goal planning.
              </p>
              <Button className="mt-5 w-full bg-secondary text-foreground hover:bg-secondary/80 border border-border">
                Check Availability
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}