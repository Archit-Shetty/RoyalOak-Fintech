import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, TrendingUp, BarChart3, MessagesSquare, Newspaper, Bell, Sparkles } from "lucide-react";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RoyalOak Fintech — Wealth advisory & smart investing" },
      { name: "description", content: "Personalized investment advice, KYC, mutual funds, SIPs, stocks and insurance — all in one elegant portal." },
      { property: "og:title", content: "RoyalOak Fintech" },
      { property: "og:description", content: "Wealth advisory and investment intelligence for the modern investor." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient text-primary-foreground">
        <div
          className="absolute inset-0 opacity-30 mix-blend-screen"
          style={{ backgroundImage: `url(${hero})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95" />
        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-gradient">
              <Sparkles className="h-3.5 w-3.5" /> SEBI registered • BSE Star integration
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] md:text-7xl">
              Invest with <span className="text-gold-gradient">clarity.</span><br/>
              Grow with conviction.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/75">
              RoyalOak combines tailored advisory, risk profiling and direct access to mutual funds, SIPs, stocks and insurance — engineered for serious wealth building.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gold-gradient text-gold-foreground hover:opacity-90 shadow-gold">
                <Link to="/register">Open free account <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/advisory">Take risk assessment</Link>
              </Button>
            </div>
            <dl className="mt-14 grid max-w-2xl grid-cols-3 gap-6">
              {[
                ["₹2,400 Cr", "Assets advised"],
                ["18,500+", "Active investors"],
                ["14.2%", "Avg. portfolio CAGR"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="font-display text-3xl text-gold-gradient">{n}</dt>
                  <dd className="text-sm text-primary-foreground/70">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">What we do</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl">A complete wealth platform.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:shadow-elegant">
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground transition-colors group-hover:bg-gold-gradient group-hover:text-gold-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="bg-secondary py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="font-display text-4xl md:text-5xl">Simple, transparent pricing.</h2>
            <p className="mt-3 text-muted-foreground">Choose the path that fits your investing style.</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            <PricingCard name="Advisory" price="₹999" period="/year" features={["Personalized risk profile","Curated fund recommendations","Quarterly portfolio review","Email & chat support"]} />
            <PricingCard featured name="Full Service" price="₹2,499" period="/year" features={["Everything in Advisory","Direct BSE Star execution","Tax & insurance planning","Dedicated wealth manager"]} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="overflow-hidden rounded-3xl bg-hero-gradient p-12 text-primary-foreground md:p-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl md:text-5xl">Your portfolio, <span className="text-gold-gradient">curated.</span></h2>
            <p className="mt-4 text-primary-foreground/75">Complete KYC in minutes and unlock institutional-grade investing.</p>
            <Button asChild size="lg" className="mt-8 bg-gold-gradient text-gold-foreground hover:opacity-90">
              <Link to="/register">Start investing <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

const features = [
  { icon: ShieldCheck, title: "Seamless KYC", desc: "Submit PAN, Aadhaar and documents in under 5 minutes — verified instantly." },
  { icon: TrendingUp, title: "Smart Risk Profiling", desc: "Answer a few questions and receive a portfolio matched to your goals." },
  { icon: BarChart3, title: "Live Portfolio Dashboard", desc: "Track holdings, returns and SIPs with beautiful real-time charts." },
  { icon: Newspaper, title: "Insights & Research", desc: "Daily blogs, webinars and Q&A from our investment desk." },
  { icon: MessagesSquare, title: "Talk to an Advisor", desc: "In-app chat with RoyalOak experts whenever you need clarity." },
  { icon: Bell, title: "Smart Notifications", desc: "Email and in-app alerts for trades, NAV moves and rebalancing." },
];

function PricingCard({ name, price, period, features, featured }: { name: string; price: string; period: string; features: string[]; featured?: boolean }) {
  return (
    <div className={`relative rounded-2xl border p-8 ${featured ? "border-transparent bg-primary text-primary-foreground shadow-elegant" : "border-border bg-card"}`}>
      {featured && <span className="absolute -top-3 left-8 rounded-full bg-gold-gradient px-3 py-1 text-xs font-semibold text-gold-foreground">Most popular</span>}
      <div className="font-display text-2xl">{name}</div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-display text-5xl">{price}</span>
        <span className={featured ? "text-primary-foreground/60" : "text-muted-foreground"}>{period}</span>
      </div>
      <ul className="mt-6 space-y-3 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className={`mt-1 h-1.5 w-1.5 rounded-full ${featured ? "bg-gold" : "bg-primary"}`} />
            {f}
          </li>
        ))}
      </ul>
      <Button asChild className={`mt-8 w-full ${featured ? "bg-gold-gradient text-gold-foreground hover:opacity-90" : ""}`} variant={featured ? "default" : "outline"}>
        <Link to="/register">Get {name}</Link>
      </Button>
    </div>
  );
}
