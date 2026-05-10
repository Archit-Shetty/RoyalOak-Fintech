import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Send } from "lucide-react";

export const Route = createFileRoute("/advisory")({
  head: () => ({ meta: [{ title: "Advisory & Chat — RoyalOak Fintech" }] }),
  component: Advisory,
});

const initialMessages = [
  { from: "advisor", text: "Hi John 👋 I'm Priya from RoyalOak. How can I help with your portfolio today?" },
];

function Advisory() {
  const [msgs, setMsgs] = useState(initialMessages);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    const user = { from: "user", text };
    setMsgs((m) => [...m, user]);
    setText("");
    setTimeout(() => {
      setMsgs((m) => [...m, { from: "advisor", text: "Great question — based on your Balanced profile I'd suggest reviewing your Flexi Cap allocation. Want me to share a rebalancing plan?" }]);
    }, 900);
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-4xl">Talk to your advisor</h1>
        <p className="mt-2 text-muted-foreground">SEBI-registered experts, real-time chat.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="overflow-hidden lg:col-span-2">
            <div className="flex h-[520px] flex-col">
              <div className="border-b border-border bg-secondary/40 p-4">
                <div className="font-display text-lg">Priya Sharma</div>
                <div className="text-xs text-success">● Online</div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {msgs.map((m, i) => (
                  <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-md rounded-2xl px-4 py-2.5 text-sm ${m.from === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <form className="flex gap-2 border-t border-border p-4" onSubmit={(e) => { e.preventDefault(); send(); }}>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask anything…" className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold" />
                <Button type="submit" className="bg-gold-gradient text-gold-foreground hover:opacity-90"><Send className="h-4 w-4" /></Button>
              </form>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Your profile</div>
              <div className="mt-2 font-display text-2xl text-gold-gradient">Balanced</div>
              <p className="mt-2 text-sm text-muted-foreground">Target return 12–15% with moderate volatility.</p>
              <Button asChild variant="outline" size="sm" className="mt-4 w-full"><Link to="/risk-assessment">Retake assessment</Link></Button>
            </Card>
            <Card className="p-6">
              <div className="font-display text-lg">Book a 1-on-1</div>
              <p className="mt-1 text-sm text-muted-foreground">Schedule a 30-min call with a senior wealth manager.</p>
              <Button className="mt-4 w-full bg-gold-gradient text-gold-foreground hover:opacity-90">Book call</Button>
            </Card>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
