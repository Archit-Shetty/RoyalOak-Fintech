import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/risk-assessment")({
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
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const done = step >= questions.length;
  const score = picks.reduce((a, b) => a + b, 0);
  const profile = score < 4 ? "Conservative" : score < 8 ? "Balanced" : "Aggressive";

  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-4xl">Risk Assessment</h1>
        <p className="mt-2 text-muted-foreground">Know your investment style.</p>
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-elegant">
          {!done ? (
            <>
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Question {step + 1} of {questions.length}</div>
              <div className="mb-6 h-1 w-full rounded-full bg-secondary">
                <div className="h-1 rounded-full bg-gold-gradient transition-all" style={{ width: `${((step) / questions.length) * 100}%` }} />
              </div>
              <h2 className="font-display text-2xl">{questions[step].q}</h2>
              <div className="mt-6 grid gap-3">
                {questions[step].opts.map((o, i) => (
                  <button
                    key={o}
                    onClick={() => { setPicks([...picks, i]); setStep(step + 1); }}
                    className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-left text-sm transition-all hover:border-gold hover:bg-secondary"
                  >
                    {o}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your profile</div>
              <div className="mt-2 font-display text-5xl text-gold-gradient">{profile}</div>
              <p className="mt-4 text-muted-foreground">We've curated a portfolio aligned with your appetite.</p>
              <Button className="mt-8 bg-gold-gradient text-gold-foreground hover:opacity-90" onClick={() => window.location.href = "/dashboard"}>
                View recommendations
              </Button>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
