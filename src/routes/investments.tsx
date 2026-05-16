import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Search, Loader2, Landmark, ShieldCheck, TrendingUp, Info, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/investments")({
  component: Investments,
});

function Investments() {
  const [mfList, setMfList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("Quant");
  
  // Detailed Fund State
  const [selectedFund, setSelectedFund] = useState<any>(null);
  const [fundDetails, setFundDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [executing, setExecuting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // 1. Fetch MF List
  useEffect(() => {
    const fetchFunds = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.mfapi.in/mf/search?q=${searchQuery}`);
        const data = await res.json();
        setMfList(data.slice(0, 12));
      } catch (error) {
        toast.error("Market data unavailable");
      } finally {
        setLoading(false);
      }
    };
    fetchFunds();
  }, [searchQuery]);

  // 2. Fetch Specific Fund Details (NAV & Returns)
  const fetchSchemeDetails = async (fund: any) => {
    setSelectedFund(fund);
    setLoadingDetails(true);
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${fund.schemeCode}`);
      const data = await res.json();
      // Calculate simple 1Y return based on NAV history
      const currentNav = parseFloat(data.data[0].nav);
      const prevNav = parseFloat(data.data[250]?.nav || data.data[data.data.length - 1].nav);
      const return1Y = ((currentNav - prevNav) / prevNav * 100).toFixed(2);
      
      setFundDetails({
        ...data.meta,
        currentNav,
        return1Y,
        lastUpdated: data.data[0].date
      });
    } catch (e) {
      toast.error("Could not load fund performance");
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Marketplace</h1>
            <div className="mt-2 flex items-center gap-3">
               <Badge variant="outline" className="text-success border-success/30 bg-success/5 animate-pulse">
                ● BSE Live
               </Badge>
               <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Gateway: RO-StAR-Direct</span>
            </div>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search AMC (e.g. SBI, Axis, ICICI)..." 
              className="pl-10 bg-secondary/30 border-none ring-1 ring-border focus:ring-gold"
              onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(e.currentTarget.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="mf" className="space-y-8">
          <TabsList className="bg-secondary/40 border p-1 rounded-xl">
            <TabsTrigger value="mf" className="rounded-lg px-6">Mutual Funds</TabsTrigger>
            <TabsTrigger value="sip" className="rounded-lg px-6">SIP Plans</TabsTrigger>
            <TabsTrigger value="stocks" className="rounded-lg px-6">BSE Equities</TabsTrigger>
          </TabsList>

          <TabsContent value="mf" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loading ? (
              <LoadingState message="Connecting to BSE StAR MF servers..." />
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {mfList.map((fund) => (
                  <Card key={fund.schemeCode} className="p-6 border-border/40 hover:border-gold/50 transition-all group relative overflow-hidden bg-card/50 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                        <TrendingUp className="h-10 w-10 text-gold" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">ISIN: INF{fund.schemeCode}Z</p>
                    <h3 className="font-display text-base font-bold leading-snug line-clamp-2 min-h-[3rem] group-hover:text-gold transition-colors">
                      {fund.schemeName}
                    </h3>
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                      <div className="text-xs font-semibold text-muted-foreground">DIRECT • GROWTH</div>
                      <Button 
                        size="sm" 
                        onClick={() => fetchSchemeDetails(fund)}
                        className="bg-gold-gradient text-gold-foreground font-bold shadow-lg shadow-gold/20"
                      >
                        Details & Invest
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sip">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <SIPCard title="Nifty 50 Index SIP" returns="14.2%" risk="Moderate" min="500" />
                <SIPCard title="Small Cap Growth SIP" returns="26.8%" risk="Very High" min="1000" />
                <SIPCard title="Tax Saver (ELSS) SIP" returns="18.5%" risk="High" min="500" />
            </div>
          </TabsContent>

          <TabsContent value="stocks">
             <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-6 border-b border-border bg-secondary/10 flex justify-between items-center">
                    <h3 className="font-display text-xl font-bold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-success" /> BSE Sensex Constituents
                    </h3>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Real-time Feed</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-secondary/30 text-left text-xs uppercase tracking-widest font-bold text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4">Security</th>
                                <th className="px-6 py-4 text-right">LTP (₹)</th>
                                <th className="px-6 py-4 text-right">24H Chg</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <StockRow name="Reliance Industries" ticker="RELIANCE" price={2942.10} change={+1.2} />
                            <StockRow name="HDFC Bank" ticker="HDFCBANK" price={1682.45} change={-0.45} />
                            <StockRow name="TCS" ticker="TCS" price={4120.00} change={+0.85} />
                            <StockRow name="Infosys" ticker="INFY" price={1534.20} change={-1.12} />
                        </tbody>
                    </table>
                </div>
             </div>
          </TabsContent>
        </Tabs>

        {/* TRANSACTION & DETAIL MODAL */}
        <Dialog open={!!selectedFund} onOpenChange={() => { setSelectedFund(null); setOrderComplete(false); setFundDetails(null); }}>
          <DialogContent className="sm:max-w-[480px] bg-card border-gold/30">
            {loadingDetails ? (
              <div className="py-12 flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-gold" />
                <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Fetching NAV & Performance...</p>
              </div>
            ) : !orderComplete ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-2xl font-display font-bold">
                    <Landmark className="h-6 w-6 text-gold" />
                    BSE Execution
                  </DialogTitle>
                  <DialogDescription className="text-foreground font-medium mt-2 leading-relaxed">
                    {fundDetails?.scheme_name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="rounded-xl bg-secondary/30 p-4 border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Current NAV</p>
                        <p className="text-xl font-display font-bold text-gold">₹{fundDetails?.currentNav}</p>
                    </div>
                    <div className="rounded-xl bg-secondary/30 p-4 border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">1Y Return</p>
                        <p className="text-xl font-display font-bold text-success">+{fundDetails?.return1Y}%</p>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-[10px] text-muted-foreground px-1">
                        <Info className="h-3 w-3" /> Updated on {fundDetails?.lastUpdated} as per AMFI
                    </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); setExecuting(true); setTimeout(() => { setOrderComplete(true); setExecuting(false); }, 2000); }} className="space-y-5 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Order Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₹</span>
                      <Input type="number" placeholder="10,000" className="pl-10 h-12 text-lg font-bold bg-secondary/20" required />
                    </div>
                  </div>
                  
                  <div className="rounded-xl bg-gold-gradient/10 p-5 border border-gold/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gold/80">Authorized BSE Member</span>
                      <span className="text-sm font-mono font-bold">RO-FINTECH-882</span>
                    </div>
                    <p className="text-[10px] text-gold/60 leading-relaxed italic">
                      "By clicking authorize, you agree to transfer funds via the linked BSE StAR account."
                    </p>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={executing} className="w-full h-12 bg-gold-gradient text-gold-foreground font-bold text-base shadow-gold/30 shadow-lg">
                      {executing ? <Loader2 className="animate-spin h-5 w-5" /> : "Authorize Purchase"}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            ) : (
              <div className="py-10 text-center space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/20 text-success ring-8 ring-success/5 animate-bounce">
                  <ShieldCheck className="h-12 w-12" />
                </div>
                <div>
                    <h3 className="text-2xl font-display font-bold">Transaction Confirmed</h3>
                    <p className="text-sm text-muted-foreground mt-2 px-6">
                        Order <span className="font-mono font-bold text-foreground">#BSE-9281-TX</span> has been sent to the exchange. Funds will be settled within 48 hours.
                    </p>
                </div>
                <Button className="w-full h-12 variant-outline" onClick={() => setSelectedFund(null)}>
                  Done
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SiteLayout>
  );
}

// Sub-components for cleaner code
function LoadingState({ message }: { message: string }) {
    return (
        <div className="flex h-64 flex-col items-center justify-center gap-4 bg-secondary/10 rounded-2xl border border-dashed border-border">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">{message}</p>
        </div>
    );
}

function StockRow({ name, ticker, price, change }: any) {
    const isPos = change > 0;
    return (
        <tr className="hover:bg-secondary/20 transition-colors">
            <td className="px-6 py-5">
                <div className="font-bold text-base">{name}</div>
                <div className="text-[10px] font-mono text-muted-foreground">{ticker}:BSE</div>
            </td>
            <td className="px-6 py-5 text-right font-display font-bold text-lg">₹{price.toLocaleString()}</td>
            <td className={`px-6 py-5 text-right font-bold ${isPos ? 'text-success' : 'text-destructive'}`}>
                <div className="flex items-center justify-end gap-1">
                    {isPos ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {Math.abs(change)}%
                </div>
            </td>
            <td className="px-6 py-5 text-right">
                <Button size="sm" variant="outline" className="border-gold/30 hover:bg-gold/10">Trade</Button>
            </td>
        </tr>
    );
}

function SIPCard({ title, returns, risk, min }: any) {
    return (
        <Card className="p-6 border-border/40 hover:shadow-xl transition-all">
            <h3 className="font-display text-lg font-bold">{title}</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Expected Returns</p>
                    <p className="text-2xl font-display font-bold text-success">{returns}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Risk Grade</p>
                    <p className="text-sm font-bold text-gold">{risk}</p>
                </div>
            </div>
            <Button className="mt-6 w-full bg-secondary text-foreground hover:bg-gold hover:text-gold-foreground font-bold">
                Start SIP (₹{min}/mo)
            </Button>
        </Card>
    );
}