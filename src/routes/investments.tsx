import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExternalLink, Star } from "lucide-react";

export const Route = createFileRoute("/investments")({
  head: () => ({ meta: [{ title: "Investments — RoyalOak Fintech" }, { name: "description", content: "Browse mutual funds, SIPs, stocks and insurance products." }] }),
  component: Investments,
});

const funds = [
  { name: "Axis Bluechip Fund", cat: "Large Cap", aum: "₹35,400 Cr", ret3y: 16.8, risk: "Moderate" },
  { name: "Parag Parikh Flexi Cap", cat: "Flexi Cap", aum: "₹68,900 Cr", ret3y: 22.4, risk: "Mod-High" },
  { name: "Mirae Asset Emerging Bluechip", cat: "Large & Mid", aum: "₹28,100 Cr", ret3y: 19.2, risk: "High" },
  { name: "ICICI Prudential Balanced Adv", cat: "Hybrid", aum: "₹52,300 Cr", ret3y: 12.7, risk: "Moderate" },
];
const stocks = [
  { name: "HDFC Bank", t: "HDFCBANK", price: 1654.2, ch: 0.84 },
  { name: "Reliance Industries", t: "RELIANCE", price: 2890.5, ch: -1.2 },
  { name: "Infosys", t: "INFY", price: 1542.8, ch: 1.4 },
  { name: "Tata Consultancy", t: "TCS", price: 3920.1, ch: 0.32 },
];
const sips = [
  { name: "Nifty 50 Index", min: "₹500/mo", ret5y: 14.2 },
  { name: "Smallcap Discovery", min: "₹1,000/mo", ret5y: 26.8 },
  { name: "Balanced Advantage", min: "₹500/mo", ret5y: 11.9 },
];
const insurance = [
  { name: "Term Life — 1Cr cover", premium: "₹742/mo", desc: "30-year term, no medical up to age 35" },
  { name: "Family Health Floater", premium: "₹1,150/mo", desc: "Covers family of 4, ₹10L sum insured" },
  { name: "ULIP Wealth Plus", premium: "₹2,500/mo", desc: "Market-linked with life cover" },
];

function Investments() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-4xl">Investments</h1>
        <p className="mt-2 text-muted-foreground">Curated by RoyalOak research desk.</p>

        <Tabs defaultValue="mf" className="mt-8">
          <TabsList>
            <TabsTrigger value="mf">Mutual Funds</TabsTrigger>
            <TabsTrigger value="sip">SIPs</TabsTrigger>
            <TabsTrigger value="stocks">Stocks</TabsTrigger>
            <TabsTrigger value="ins">Insurance</TabsTrigger>
          </TabsList>

          <TabsContent value="mf" className="mt-6 grid gap-4 md:grid-cols-2">
            {funds.map((f) => (
              <Card key={f.name} className="group p-6 transition-all hover:shadow-elegant">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2"><h3 className="font-display text-lg">{f.name}</h3><Star className="h-3.5 w-3.5 fill-gold text-gold" /></div>
                    <div className="mt-1 text-xs text-muted-foreground">{f.cat} • AUM {f.aum} • Risk {f.risk}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">3Y Returns</div>
                    <div className="font-display text-2xl text-success">{f.ret3y}%</div>
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <Button size="sm" className="bg-gold-gradient text-gold-foreground hover:opacity-90">Invest now</Button>
                  <Button size="sm" variant="outline">View details</Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="sip" className="mt-6 grid gap-4 md:grid-cols-3">
            {sips.map((s) => (
              <Card key={s.name} className="p-6">
                <h3 className="font-display text-lg">{s.name}</h3>
                <div className="mt-1 text-xs text-muted-foreground">Min {s.min}</div>
                <div className="mt-4 font-display text-3xl text-success">{s.ret5y}%</div>
                <div className="text-xs text-muted-foreground">5Y CAGR</div>
                <Button size="sm" className="mt-6 w-full bg-gold-gradient text-gold-foreground hover:opacity-90">Start SIP</Button>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="stocks" className="mt-6">
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="px-6 py-3">Company</th><th className="px-6 py-3">Ticker</th><th className="px-6 py-3 text-right">Price</th><th className="px-6 py-3 text-right">Change</th><th className="px-6 py-3 text-right">Action</th></tr>
                </thead>
                <tbody>
                  {stocks.map((s) => (
                    <tr key={s.t} className="border-t border-border">
                      <td className="px-6 py-4 font-medium">{s.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{s.t}</td>
                      <td className="px-6 py-4 text-right tabular-nums">₹{s.price.toFixed(2)}</td>
                      <td className={`px-6 py-4 text-right tabular-nums font-medium ${s.ch >= 0 ? "text-success" : "text-destructive"}`}>{s.ch >= 0 ? "+" : ""}{s.ch}%</td>
                      <td className="px-6 py-4 text-right"><Button size="sm" variant="outline">Trade <ExternalLink className="ml-1 h-3 w-3" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <p className="mt-4 text-xs text-muted-foreground">Trades execute via your linked BSE Star account.</p>
          </TabsContent>

          <TabsContent value="ins" className="mt-6 grid gap-4 md:grid-cols-3">
            {insurance.map((i) => (
              <Card key={i.name} className="p-6">
                <h3 className="font-display text-lg">{i.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{i.desc}</p>
                <div className="mt-4 font-display text-2xl">{i.premium}</div>
                <Button size="sm" className="mt-6 w-full bg-gold-gradient text-gold-foreground hover:opacity-90">Get a quote</Button>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <div className="mt-12 rounded-2xl bg-secondary p-8">
          <p className="text-sm text-muted-foreground">Need help choosing?</p>
          <Link to="/advisory" className="font-display text-2xl underline">Talk to a RoyalOak advisor →</Link>
        </div>
      </div>
    </SiteLayout>
  );
}
