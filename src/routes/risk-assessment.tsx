import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ChevronRight, Info } from "lucide-react";

export const Route = createFileRoute("/risk-assessment")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      onboarding: (search.onboarding as string) === "true",
    };
  },
  head: () => ({ meta: [{ title: "Risk Assessment — RoyalOak Fintech" }] }),
  component: Risk,
});

// Weighted questions based on Financial Planning standards
const questions = [
  { 
    q: "What is your primary investment goal?", 
    opts: [
      { label: "Protect my savings (Capital Preservation)", weight: 1 },
      { label: "Supplement my monthly income", weight: 2 },
      { label: "Long-term wealth accumulation", weight: 3 },
      { label: "Maximum potential returns (Speculation)", weight: 5 }
    ] 
  },
  { 
    q: "How long do you plan to keep your money invested?", 
    opts: [
      { label: "Less than 2 years", weight: 1 },
      { label: "2 to 5 years", weight: 3 },
      { label: "5 to 10 years", weight: 4 },
      { label: "Over 10 years", weight: 6 }
    ] 
  },
  { 
    q: "If the stock market dropped 20% tomorrow, what would you do?", 
    opts: [
      { label: "Panic and sell all remaining investments", weight: 0 },
      { label: "Sell a portion to prevent further losses", weight: 2 },
      { label: "Do nothing and wait for recovery", weight: 4 },
      { label: "Invest more money to take advantage of lower prices", weight: 7 }
    ] 
  },
  { 
    q: "How would you describe your knowledge of financial markets?", 
    opts: [
      { label: "Beginner: I'm just starting out", weight: 1 },
      { label: "Intermediate: I understand basic asset classes", weight: 3 },
      { label: "Advanced: I trade and follow market cycles", weight: 5 }
    ] 
  },
  { 
    q: "What percentage of your total income is available for investing?", 
    opts: [
      { label: "Less than 10%", weight: 1 },
      { label: "10% to 25%", weight: 3 },
      { label: "More than 25%", weight: 5 }
    ] 
  }
];

const getAdvice = (profile: string) => {
  switch (profile) {
    case "Conservative":
      return "Focus on Debt Funds, Fixed Deposits, and Gold. Aim for 7-9% stable returns with minimal volatility.";
    case "Balanced":
      return "A 50/50 split between Blue-chip Equities and Bonds. Aim for 10-12% returns with moderate fluctuations.";
    case "Aggressive":
      return "Focus on Small/Mid-cap stocks and sector-specific funds. Aim for 15%+ returns, accepting high volatility.";
    default:
      return "";
  }
};

function Risk() {
  const { onboarding } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [saving, setSaving] = useState(false);

  const done = step >= questions.length;
  
  // Dynamic Profile Determination
  const profile = totalScore < 10 ? "Conservative" : totalScore < 20 ? "Balanced" : "Aggressive";

  const handleOptionClick = (weight: number) => {
    setTotalScore((prev) => prev + weight);
    setStep((prev) => prev + 1);
  };

  const saveRiskProfile = async (finalProfile: string) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        riskProfile: finalProfile,
        riskScore: totalScore,
        investmentAdvice: getAdvice(finalProfile),
        assessmentCompletedAt: serverTimestamp(),
      });
      toast.success(`Strategy set: ${finalProfile}`);
      handleFinalRedirect();
    } catch (err: any) {
      toast.error("Failed to save profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalRedirect = () => {
    onboarding ? navigate({ to: "/dashboard" }) : navigate({ to: "/profile" });
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-4xl font-bold tracking-tight">Risk Appetite</h1>
        <p className="mt-2 text-muted-foreground">Answer these to unlock your personalized investment advisor.</p>
        
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-elegant overflow-hidden relative">
          {!done ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-gold">Step {step + 1} of {questions.length}</span>
                <button onClick={handleFinalRedirect} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Skip for now</button>
              </div>
              
              <div className="mb-8 h-1.5 w-full rounded-full bg-secondary">
                <div 
                  className="h-1.5 rounded-full bg-gold-gradient transition-all duration-500 ease-out" 
                  style={{ width: `${(step / questions.length) * 100}%` }} 
                />
              </div>

              <h2 className="font-display text-2xl font-medium leading-snug">{questions[step].q}</h2>
              
              <div className="mt-8 grid gap-4">
                {questions[step].opts.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleOptionClick(opt.weight)}
                    className="group flex items-center justify-between rounded-xl border border-border bg-secondary/10 px-6 py-5 text-left transition-all hover:border-gold hover:bg-secondary/30 active:scale-[0.98]"
                  >
                    <span className="text-sm font-medium pr-4">{opt.label}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-gold group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
                <ShieldCheck className="h-10 w-10 text-gold" />
              </div>
              
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Your Financial DNA</h2>
              <div className="mt-2 font-display text-6xl font-bold text-gold-gradient">{profile}</div>
              
              <div className="mt-8 rounded-xl bg-secondary/20 p-6 text-left border border-border/50">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Strategic Advice:</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {getAdvice(profile)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10 flex flex-col gap-3">
                <Button 
                  disabled={saving}
                  className="h-14 bg-gold-gradient text-gold-foreground text-base shadow-xl hover:shadow-gold/20 transition-all font-bold" 
                  onClick={() => saveRiskProfile(profile)}
                >
                  {saving ? <Loader2 className="animate-spin" /> : "Deploy This Strategy"}
                </Button>
                <Button variant="ghost" onClick={handleFinalRedirect} className="text-muted-foreground">
                  Decide Later
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}