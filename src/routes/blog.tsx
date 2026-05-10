import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Calendar, Play, MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/blog")({
  head: () => ({ meta: [{ title: "Insights — RoyalOak Fintech" }, { name: "description", content: "Daily blogs, webinars and market Q&A from RoyalOak experts." }] }),
  component: Blog,
});

const posts = [
  { tag: "Markets", title: "Why mid-cap valuations look stretched in 2026", author: "Rahul Mehta", date: "May 4", read: "5 min" },
  { tag: "Tax", title: "New capital gains rules: what investors must know", author: "Anita Desai", date: "May 3", read: "7 min" },
  { tag: "Strategy", title: "Building a 3-bucket retirement portfolio", author: "Vikram Singh", date: "May 1", read: "9 min" },
  { tag: "SIPs", title: "Stop pausing your SIPs — the math behind it", author: "Priya Sharma", date: "Apr 28", read: "4 min" },
];
const webinars = [
  { title: "Live: Quarterly Market Outlook", when: "May 12 • 6:00 PM IST" },
  { title: "Insurance vs Investment: drawing the line", when: "May 18 • 7:30 PM IST" },
];

function Blog() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-5xl">Insights</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">Daily research, market commentary and webinars from RoyalOak's investment desk.</p>

        <div className="mt-12 grid gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {posts.map((p) => (
              <Card key={p.title} className="group cursor-pointer p-6 transition-all hover:shadow-elegant">
                <div className="text-xs font-semibold uppercase tracking-widest text-gold-gradient">{p.tag}</div>
                <h2 className="mt-2 font-display text-2xl group-hover:underline">{p.title}</h2>
                <div className="mt-3 text-sm text-muted-foreground">{p.author} • {p.date} • {p.read} read</div>
              </Card>
            ))}
          </div>

          <aside className="space-y-6">
            <Card className="p-6">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"><Play className="h-3.5 w-3.5" /> Upcoming webinars</div>
              <ul className="space-y-4">
                {webinars.map((w) => (
                  <li key={w.title} className="border-l-2 border-gold pl-3">
                    <div className="font-medium">{w.title}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> {w.when}</div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="bg-primary p-6 text-primary-foreground">
              <MessagesSquare className="h-5 w-5 text-gold" />
              <div className="mt-3 font-display text-xl">Investor Q&A</div>
              <p className="mt-1 text-sm text-primary-foreground/70">Submit a question — top picks answered weekly.</p>
            </Card>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
