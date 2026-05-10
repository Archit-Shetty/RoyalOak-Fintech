import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Pricing — RoyalOak Fintech" }] }),
  component: Pricing,
});

const tiers = [
  { name: "Advisory", price: "₹999", desc: "For self-directed investors who want expert guidance.", features: ["Risk profiling","Portfolio recommendations","Quarterly review","Email & chat support","Insights & webinars"] },
  { name: "Full Service", price: "₹2,499", featured: true, desc: "Everything done for you — advice + execution.", features: ["Everything in Advisory","BSE Star direct execution","Tax & insurance planning","Dedicated wealth manager","Priority phone support","Goal-based planning"] },
];

function Pricing() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center">
          <h1 className="font-display text-5xl">Pricing built for investors.</h1>
          <p className="mt-4 text-muted-foreground">Two plans. No hidden fees. Cancel anytime.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {tiers.map((t) => (
            <div key={t.name} className={`relative rounded-3xl border p-10 ${t.featured ? "border-transparent bg-primary text-primary-foreground shadow-elegant" : "border-border bg-card"}`}>
              {t.featured && <span className="absolute -top-3 left-10 rounded-full bg-gold-gradient px-3 py-1 text-xs font-semibold text-gold-foreground">Most popular</span>}
              <div className="font-display text-2xl">{t.name}</div>
              <p className={`mt-2 text-sm ${t.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-6xl">{t.price}</span>
                <span className={t.featured ? "text-primary-foreground/60" : "text-muted-foreground"}>/year</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${t.featured ? "text-gold" : "text-success"}`} /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className={`mt-10 h-12 w-full ${t.featured ? "bg-gold-gradient text-gold-foreground hover:opacity-90" : ""}`} variant={t.featured ? "default" : "outline"}>
                <Link to="/register">Choose {t.name}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
