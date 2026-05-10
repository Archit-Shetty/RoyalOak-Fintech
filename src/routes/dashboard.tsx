import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, ArrowUpRight, Wallet, PiggyBank, LineChart as LineIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — RoyalOak Fintech" }] }),
  component: Dashboard,
});

interface Holding {
  name: string;
  type: string;
  units: number;
  val: number;
  ret: number;
}

interface PortfolioEntry {
  m: number;
  v: number;
}

interface PortfolioMetrics {
  totalValue: number;
  todaysPl: number;
  invested: number;
  xirr: number;
  history: PortfolioEntry[];
}

const defaultPortfolio: PortfolioMetrics = {
  totalValue: 0,
  todaysPl: 0,
  invested: 0,
  xirr: 0,
  history: Array.from({ length: 24 }, (_, i) => ({ m: i, v: 0 })),
};

const defaultAllocation = [
  { name: "Equity MF", value: 0 },
  { name: "Stocks", value: 0 },
  { name: "SIPs", value: 0 },
  { name: "Insurance", value: 0 },
];
const colors = ["oklch(0.28 0.08 260)", "oklch(0.78 0.14 80)", "oklch(0.68 0.16 150)", "oklch(0.6 0.15 200)"];

const defaultHoldings: Holding[] = [];

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [userName, setUserName] = useState<string>("");
  const [portfolioData, setPortfolioData] = useState<PortfolioMetrics>(defaultPortfolio);
  const [allocationData, setAllocationData] = useState(defaultAllocation);
  const [holdingsData, setHoldingsData] = useState<Holding[]>(defaultHoldings);

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchDashboardData = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.data() ?? {};
        setUserName(data?.name ?? user.displayName ?? user.email?.split("@")[0] ?? "Investor");

        const portfolio = data?.portfolio ?? {};
        setPortfolioData({
          totalValue: portfolio?.totalValue ?? defaultPortfolio.totalValue,
          todaysPl: portfolio?.todaysPl ?? defaultPortfolio.todaysPl,
          invested: portfolio?.invested ?? defaultPortfolio.invested,
          xirr: portfolio?.xirr ?? defaultPortfolio.xirr,
          history: portfolio?.history?.length ? portfolio.history : defaultPortfolio.history,
        });

        setAllocationData(data?.allocation?.length ? data.allocation : defaultAllocation);
        setHoldingsData(data?.holdings?.length ? data.holdings : defaultHoldings);
      } catch {
        setUserName(user.displayName ?? user.email?.split("@")[0] ?? "Investor");
        setPortfolioData(defaultPortfolio);
        setAllocationData(defaultAllocation);
        setHoldingsData(defaultHoldings);
      }
    };

    fetchDashboardData();
  }, [user, authLoading]);

  const name = userName || user?.displayName || user?.email?.split("@")[0] || "Investor";

  if (authLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="text-center text-muted-foreground">Loading your portfolio…</div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="font-display text-4xl">{name}</h1>
          </div>
          <Button asChild className="bg-gold-gradient text-gold-foreground hover:opacity-90">
            <Link to="/investments">Browse investments <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <StatCard icon={Wallet} label="Total value" value={`₹${portfolioData.totalValue.toLocaleString()}`} delta={portfolioData.todaysPl >= 0 ? `+₹${portfolioData.todaysPl.toLocaleString()}` : `-₹${Math.abs(portfolioData.todaysPl).toLocaleString()}`} up={portfolioData.todaysPl >= 0} />
          <StatCard icon={LineIcon} label="Today's P&L" value={`${portfolioData.todaysPl >= 0 ? '+' : '-'}₹${Math.abs(portfolioData.todaysPl).toLocaleString()}`} delta={portfolioData.invested ? `${((portfolioData.todaysPl / portfolioData.invested) * 100).toFixed(2)}%` : "0.00%"} up={portfolioData.todaysPl >= 0} />
          <StatCard icon={PiggyBank} label="Invested" value={`₹${portfolioData.invested.toLocaleString()}`} delta={holdingsData.length ? `across ${holdingsData.length} holdings` : "No investments yet"} />
          <StatCard icon={TrendingUp} label="XIRR" value={`${portfolioData.xirr.toFixed(1)}%`} delta="vs Nifty 11.2%" up={portfolioData.xirr >= 0} />
        </div>

        {/* Charts */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">Portfolio value</h2>
              <span className="text-xs text-muted-foreground">Last 24 months</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={portfolioData.history}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.14 80)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.78 0.14 80)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.4} />
                  <YAxis tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.4} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="v" stroke="oklch(0.78 0.14 80)" strokeWidth={2.5} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="font-display text-xl">Allocation</h2>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={allocationData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {allocationData.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-2 text-sm">
              {allocationData.map((a, i) => (
                <li key={a.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: colors[i] }} />{a.name}</span>
                  <span className="font-medium">{a.value}%</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Holdings */}
        <Card className="mt-8 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Holdings</h2>
            <Button variant="ghost" size="sm">Export CSV</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="pb-3">Instrument</th><th className="pb-3">Type</th><th className="pb-3 text-right">Units</th><th className="pb-3 text-right">Value</th><th className="pb-3 text-right">Returns</th></tr>
              </thead>
              <tbody>
                {holdingsData.length ? holdingsData.map((h) => (
                  <tr key={h.name} className="border-t border-border">
                    <td className="py-3 font-medium">{h.name}</td>
                    <td className="py-3 text-muted-foreground">{h.type}</td>
                    <td className="py-3 text-right tabular-nums">{h.units.toFixed(2)}</td>
                    <td className="py-3 text-right tabular-nums">₹{h.val.toLocaleString()}</td>
                    <td className={`py-3 text-right tabular-nums font-medium ${h.ret > 0 ? "text-success" : "text-destructive"}`}>
                      {h.ret > 0 ? "+" : ""}{h.ret}%
                    </td>
                  </tr>
                )) : (
                  <tr className="border-t border-border">
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">No holdings yet — start investing to build your portfolio.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </SiteLayout>
  );
}

function StatCard({ icon: Icon, label, value, delta, up }: any) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 font-display text-3xl">{value}</div>
      <div className={`mt-1 flex items-center gap-1 text-xs ${up ? "text-success" : "text-muted-foreground"}`}>
        {up && <TrendingUp className="h-3 w-3" />}{delta}
      </div>
    </Card>
  );
}
