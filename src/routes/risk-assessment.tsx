import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/risk-assessment")({
  // 1. Define search params to match KYC/Register flow
  validateSearch: (search: Record<string, unknown>) => {
    return {
      onboarding: (search.onboarding as string) === "true",
    };
  },
  head: () => ({ meta: [{ title: "Risk Assessment — RoyalOak Fintech" }] }),
  component: Risk,
});

const questions = [
  { q: "What is your primary investment goal?", opts: ["Capital preservation", "Steady income", "Balanced growth", "Aggressive growth"] },
  { q: "How long can you stay invested?", opts: ["< 1 year", "1–3 years", "3–7 years", "> 7 years"] },
  { q: "How would you react to a 20% market drop?", opts: ["Sell everything", "Sell some", "Hold", "Buy more"] },
  { q: "What % of income can you invest monthly?", opts: ["< 5%", "5–15%", "15–30%", "> 30%"] },
];

function Risk() {
  const { onboarding } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const done = step >= questions.length;
  const score = picks.reduce((a, b) => a + b, 0);
  
  // Scoring logic: Aggressive usually starts at higher cumulative scores
  const profile = score < 5 ? "Conservative" : score < 9 ? "Balanced" : "Aggressive";

  const saveRiskProfile = async (finalProfile: string) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        riskProfile: finalProfile,
        riskScore: score,
        assessmentCompletedAt: serverTimestamp(),
      });
      toast.success(`Risk profile saved as ${finalProfile}`);
      handleFinalRedirect();
    } catch (err: any) {
      toast.error("Failed to save profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalRedirect = () => {
    if (onboarding) {
      navigate({ to: "/dashboard" });
    } else {
      // If they took it from Home/Profile, send them back to Profile
      navigate({ to: "/profile" });
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-4xl font-bold">Risk Assessment</h1>
        <p className="mt-2 text-muted-foreground">Tailoring your investment journey.</p>
        
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-elegant">
          {!done ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Question {step + 1} of {questions.length}
                </div>
                <button 
                  onClick={handleFinalRedirect}
                  className="text-xs text-muted-foreground hover:text-gold underline underline-offset-4"
                >
                  Skip test
                </button>
              </div>
              <div className="mb-6 h-1.5 w-full rounded-full bg-secondary">
                <div 
                  className="h-1.5 rounded-full bg-gold-gradient transition-all duration-500" 
                  style={{ width: `${((step) / questions.length) * 100}%` }} 
                />
              </div>
              <h2 className="font-display text-2xl font-medium leading-tight">{questions[step].q}</h2>
              <div className="mt-8 grid gap-3">
                {questions[step].opts.map((o, i) => (
                  <button
                    key={o}
                    onClick={() => { setPicks([...picks, i]); setStep(step + 1); }}
                    className="group flex items-center justify-between rounded-xl border border-border bg-secondary/20 px-5 py-4 text-left text-sm transition-all hover:border-gold hover:bg-secondary/60"
                  >
                    <span className="font-medium">{o}</span>
                    <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1 text-gold" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-gold/10 text-gold">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your Strategy</div>
              <div className="mt-2 font-display text-5xl font-bold text-gold-gradient">{profile}</div>
              <p className="mt-4 text-muted-foreground max-w-xs mx-auto">
                Based on your goals, we recommend a <strong>{profile}</strong> asset allocation.
              </p>
              
              <div className="mt-10 flex flex-col gap-3">
                <Button 
                  disabled={saving}
                  className="h-12 bg-gold-gradient text-gold-foreground hover:opacity-90 shadow-lg font-semibold" 
                  onClick={() => saveRiskProfile(profile)}
                >
                  {saving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Apply Strategy & Continue"}
                </Button>
                <Button variant="ghost" onClick={handleFinalRedirect} className="text-muted-foreground">
                  Back to {onboarding ? "Dashboard" : "Profile"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}