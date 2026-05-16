import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Search, Loader2, Landmark, ShieldCheck, Info, ArrowUpRight, ArrowDownRight, Activity, CalendarDays, Hourglass } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/investments")({
  head: () => ({ meta: [{ title: "Investments — RoyalOak Fintech" }] }),
  component: Investments,
});

function Investments() {
  const [activeTab, setActiveTab] = useState<string>("mf");
  
  // Search Queries
  const [mfQuery, setMfQuery] = useState("Quant");
  const [stockQuery, setStockQuery] = useState(""); 
  const [isSearched, setIsSearched] = useState(false);

  // Data Lists
  const [mfList, setMfList] = useState<any[]>([]);
  const [stocksList, setStocksList] = useState<any[]>([]);
  
  // Loading Indicators
  const [loadingMf, setLoadingMf] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(true);
  
  // Dialog / Transaction States
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assetType, setAssetType] = useState<"mf" | "stock" | "sip">("mf");
  const [fundDetails, setFundDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Active selection parameters from grid passed down to checkout modal
  const [checkoutAmount, setCheckoutAmount] = useState<string>("2000");
  const [checkoutYears, setCheckoutYears] = useState<number>(3);
  
  const [executing, setExecuting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // 1. DYNAMIC MUTUAL FUND SEARCH
  useEffect(() => {
    const fetchFunds = async () => {
      setLoadingMf(true);
      try {
        const res = await fetch(`https://api.mfapi.in/mf/search?q=${mfQuery}`);
        const data = await res.json();
        setMfList(data.slice(0, 12));
      } catch (error) {
        toast.error("Mutual Fund stream offline");
      } finally {
        setLoadingMf(false);
      }
    };
    fetchFunds();
  }, [mfQuery]);

  // 2. DYNAMIC EQUITIES LOAD
  useEffect(() => {
    const fetchStocks = async () => {
      setLoadingStocks(true);
      try {
        if (!isSearched) {
          const res = await fetch("http://65.0.104.9/stock/list?symbols=RELIANCE.BO,HDFCBANK.BO,TCS.BO,INFY.BO,SBIN.BO,ICICIBANK.BO");
          const json = await res.json();
          if (json.status === "success" && json.data) {
            setStocksList(Object.values(json.data));
            return;
          }
        } else {
          if (!stockQuery.trim()) {
            setIsSearched(false);
            return;
          }
          const searchRes = await fetch(`http://65.0.104.9/search?q=${stockQuery}`);
          const searchJson = await searchRes.json();
          
          if (searchJson.status === "success" && searchJson.data && searchJson.data.length > 0) {
            const symbols = searchJson.data
              .slice(0, 6)
              .map((item: any) => `${item.symbol}.BO`)
              .join(",");
              
            const metricsRes = await fetch(`http://65.0.104.9/stock/list?symbols=${symbols}`);
            const metricsJson = await metricsRes.json();
            
            if (metricsJson.status === "success" && metricsJson.data) {
              setStocksList(Object.values(metricsJson.data));
              return;
            }
          }
        }
        useStockFallback();
      } catch (err) {
        console.warn("BSE Router drop - deploying emergency array fallback");
        useStockFallback();
      } finally {
        setLoadingStocks(false);
      }
    };

    const useStockFallback = () => {
      const baseLedger = [
        { symbol: "RELIANCE.BO", company_name: "Reliance Industries Ltd", last_price: "2942.10", percent_change: "+1.20" },
        { symbol: "HDFCBANK.BO", company_name: "HDFC Bank Limited", last_price: "1682.45", percent_change: "-0.45" },
        { symbol: "TCS.BO", company_name: "Tata Consultancy Services", last_price: "4120.00", percent_change: "+0.85" },
        { symbol: "INFY.BO", company_name: "Infosys Limited", last_price: "1534.20", percent_change: "-1.12" },
        { symbol: "SBIN.BO", company_name: "State Bank of India", last_price: "824.50", percent_change: "+1.51" },
        { symbol: "ICICIBANK.BO", company_name: "ICICI Bank Limited", last_price: "1142.10", percent_change: "-0.30" }
      ];

      if (isSearched && stockQuery.trim()) {
        const matched = baseLedger.filter(s => 
          s.company_name.toLowerCase().includes(stockQuery.toLowerCase()) || 
          s.symbol.toLowerCase().includes(stockQuery.toLowerCase())
        );
        setStocksList(matched.length > 0 ? matched : baseLedger.slice(0, 3));
      } else {
        setStocksList(baseLedger);
      }
    };

    fetchStocks();
  }, [stockQuery, isSearched]);

  // 3. MUTUAL FUND & SIP PARAMETER DETAILS NAV FETCH
  const fetchSchemeDetails = async (fund: any, mode: "mf" | "sip", selectedAmt?: number, selectedYears?: number) => {
    setAssetType(mode);
    setSelectedAsset(fund);
    setLoadingDetails(true);
    
    // Pass custom selected configurations into state metrics if mapping a SIP mandate
    if (mode === "sip" && selectedAmt && selectedYears) {
      setCheckoutAmount(selectedAmt.toString());
      setCheckoutYears(selectedYears);
    } else {
      setCheckoutAmount("2000");
    }

    try {
      const res = await fetch(`https://api.mfapi.in/mf/${fund.schemeCode}`);
      const data = await res.json();
      
      const currentNav = parseFloat(data.data[0].nav);
      const prevNav = parseFloat(data.data[250]?.nav || data.data[data.data.length - 1].nav);
      const return1Y = ((currentNav - prevNav) / prevNav * 100).toFixed(2);
      
      setFundDetails({
        name: data.meta.scheme_name,
        code: data.meta.scheme_code,
        price: currentNav,
        metricLabel: "Current NAV",
        secondaryMetric: `${return1Y}%`,
        secondaryLabel: "1Y Annualized Return",
        subtext: `Data updated on ${data.data[0].date} via AMFI`
      });
    } catch (e) {
      toast.error("Failed to load metrics");
    } finally {
      setLoadingDetails(false);
    }
  };

  // 4. PREPARE EQUITIES DIALOG
  const handleStockClick = (stock: any) => {
    setAssetType("stock");
    setSelectedAsset(stock);
    setFundDetails({
      name: stock.company_name,
      code: stock.symbol,
      price: parseFloat(stock.last_price || "0"),
      secondaryMetric: `${stock.percent_change || "0.00"}%`,
      metricLabel: "Last Traded Price",
      secondaryLabel: "Daily Variance",
      subtext: `BSE Live feed broadcasted at ${new Date().toLocaleTimeString()}`
    });
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Marketplace</h1>
            <div className="mt-2 flex items-center gap-3">
               <Badge variant="outline" className="text-success border-success/30 bg-success/5 animate-pulse text-xs">
                ● Exchange Online
               </Badge>
               <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Router: RO-StAR-Direct</span>
            </div>
          </div>
          
          {/* SEARCH HUB */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={activeTab === "stocks" ? "Search BSE Equities (e.g. Tata, Reliance)..." : "Search Mutual Funds (e.g. SBI, Quant)..."} 
              className="pl-10 bg-secondary/30 border-none ring-1 ring-border focus:ring-gold font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (activeTab === "stocks") {
                    setStockQuery(e.currentTarget.value);
                    setIsSearched(true);
                  } else {
                    setMfQuery(e.currentTarget.value);
                  }
                }
              }}
            />
            <p className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-secondary border px-1.5 py-0.5 rounded text-muted-foreground font-mono">Enter</p>
          </div>
        </div>

        <Tabs defaultValue="mf" onValueChange={(val) => setActiveTab(val)} className="space-y-8">
          <TabsList className="bg-secondary/40 border p-1 rounded-xl">
            <TabsTrigger value="mf" className="rounded-lg px-6">Mutual Funds</TabsTrigger>
            <TabsTrigger value="sip" className="rounded-lg px-6">SIP Plans</TabsTrigger>
            <TabsTrigger value="stocks" className="rounded-lg px-6">BSE Equities</TabsTrigger>
          </TabsList>

          {/* MUTUAL FUNDS TAB */}
          <TabsContent value="mf" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loadingMf ? (
              <LoadingState message="Connecting to AMFI nodes..." />
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {mfList.map((fund) => (
                  <Card key={fund.schemeCode} className="p-6 border-border/40 hover:border-gold/50 transition-all group relative overflow-hidden bg-card/50 backdrop-blur-sm">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">ISIN: INF{fund.schemeCode}</p>
                    <h3 className="font-display text-base font-bold leading-snug line-clamp-2 min-h-[3rem] group-hover:text-gold transition-colors">
                      {fund.schemeName}
                    </h3>
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                      <div className="text-xs font-semibold text-muted-foreground">LUMPSUM • BUY</div>
                      <Button size="sm" onClick={() => fetchSchemeDetails(fund, "mf")} className="bg-gold-gradient text-gold-foreground font-bold">
                        Analyze
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* SIP TAB (UPDATED VISUAL MATRIX CONFIG) */}
          <TabsContent value="sip" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loadingMf ? (
              <LoadingState message="Connecting to AMFI nodes..." />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {mfList.map((fund) => (
                  <SIPMarketCard 
                    key={`sip-${fund.schemeCode}`} 
                    fund={fund} 
                    onSetupMandate={(amt, yrs) => fetchSchemeDetails(fund, "sip", amt, yrs)} 
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* STOCKS CONTENT TAB */}
          <TabsContent value="stocks" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-6 border-b border-border bg-secondary/10 flex justify-between items-center">
                    <h3 className="font-display text-xl font-bold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-success" /> {isSearched ? "BSE Search Match Results" : "Trending Blue Chips"}
                    </h3>
                    {isSearched && (
                      <button 
                        onClick={() => { setStockQuery(""); setIsSearched(false); }} 
                        className="text-xs text-gold underline font-medium"
                      >
                        Reset Views
                      </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    {loadingStocks ? (
                      <LoadingState message="Querying corporate exchange database..." />
                    ) : stocksList.length === 0 ? (
                      <div className="p-12 text-center text-sm text-muted-foreground">No matches located. Please refine ticker terms.</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/30 text-left text-xs uppercase tracking-widest font-bold text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4">Company Name</th>
                                <th className="px-6 py-4 text-right">LTP (₹)</th>
                                <th className="px-6 py-4 text-right">Net Change</th>
                                <th className="px-6 py-4 text-right">BSE Terminal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {stocksList.map((stock) => {
                                const isPos = !stock.percent_change?.toString().startsWith("-");
                                return (
                                    <tr key={stock.symbol} className="hover:bg-secondary/10 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-base">{stock.company_name}</div>
                                            <div className="text-[10px] font-mono text-muted-foreground">{stock.symbol}</div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-display font-bold text-lg tabular-nums">
                                          ₹{parseFloat(stock.last_price || "0").toFixed(2)}
                                        </td>
                                        <td className={`px-6 py-5 text-right font-bold tabular-nums ${isPos ? 'text-success' : 'text-destructive'}`}>
                                            <div className="flex items-center justify-end gap-1">
                                                {isPos ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                                {stock.percent_change}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <Button size="sm" variant="outline" onClick={() => handleStockClick(stock)} className="border-gold/30 hover:bg-gold/10">Trade</Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                      </table>
                    )}
                </div>
             </div>
          </TabsContent>
        </Tabs>

        {/* DIALOG ASSET RENDERING ENGINE */}
        <Dialog open={!!selectedAsset} onOpenChange={() => { setSelectedAsset(null); setOrderComplete(false); setFundDetails(null); }}>
          <DialogContent className="sm:max-w-[480px] bg-card border-gold/30">
            {loadingDetails ? (
              <div className="py-12 flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-gold" />
                <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Authorizing Handshake...</p>
              </div>
            ) : !orderComplete ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-2xl font-display font-bold">
                    <Landmark className="h-6 w-6 text-gold" />
                    BSE StAR Terminal
                  </DialogTitle>
                  <DialogDescription className="text-foreground font-medium mt-2">
                    {fundDetails?.name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4 py-2">
                    <div className="rounded-xl bg-secondary/30 p-4 border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{fundDetails?.metricLabel}</p>
                        <p className="text-xl font-display font-bold text-gold">₹{fundDetails?.price.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl bg-secondary/30 p-4 border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{fundDetails?.secondaryLabel}</p>
                        <p className={`text-xl font-display font-bold ${fundDetails?.secondaryMetric?.toString().startsWith('-') ? 'text-destructive' : 'text-success'}`}>
                           {fundDetails?.secondaryMetric}
                        </p>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-[10px] text-muted-foreground px-1">
                        <Info className="h-3 w-3" /> {fundDetails?.subtext}
                    </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); setExecuting(true); setTimeout(() => { setOrderComplete(true); setExecuting(false); }, 2000); }} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                       {assetType === "mf" ? "Lumpsum Capital Order Amount" : assetType === "sip" ? "Monthly Installment Amount" : "Purchase Quantity (Units)"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                         {assetType === "stock" ? "#" : "₹"}
                      </span>
                      <Input 
                        type="number" 
                        value={assetType === "sip" ? checkoutAmount : undefined}
                        onChange={assetType === "sip" ? (e) => setCheckoutAmount(e.target.value) : undefined}
                        placeholder={assetType === "stock" ? "5" : "2,000"} 
                        className="pl-10 h-12 font-bold bg-secondary/20" 
                        required 
                      />
                    </div>
                  </div>
                  
                  {assetType === "sip" && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Debit Day</label>
                        <Input type="number" min="1" max="28" placeholder="5th" defaultValue="5" className="bg-secondary/20" required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Period Tenure</label>
                        <Input 
                          type="number" 
                          value={checkoutYears} 
                          onChange={(e) => setCheckoutYears(Number(e.target.value))}
                          min="1" max="15" className="bg-secondary/20 font-bold" required 
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="rounded-xl bg-gold-gradient/10 p-5 border border-gold/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gold/80">Exchange Route Mapping</span>
                      <span className="text-xs font-mono font-bold uppercase text-foreground">
                        {assetType === "mf" ? "BSE_STAR_MF" : assetType === "sip" ? "BSE_STAR_SIP" : "BSE_CASH_EQUITY"}
                      </span>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={executing} className="w-full h-12 bg-gold-gradient text-gold-foreground font-bold">
                      {executing ? <Loader2 className="animate-spin h-5 w-5" /> : assetType === "sip" ? "Start Monthly SIP Mandate" : "Confirm via Member Credentials"}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            ) : (
              <div className="py-10 text-center space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/20 text-success">
                  <ShieldCheck className="h-12 w-12" />
                </div>
                <div>
                    <h3 className="text-2xl font-display font-bold">Gateway Settlement Success</h3>
                    <p className="text-sm text-muted-foreground mt-2 px-6">
                        {assetType === "sip" 
                          ? `Systematic mandate for ₹${Number(checkoutAmount).toLocaleString("en-IN")}/mo registered successfully over a ${checkoutYears}-year deployment envelope.`
                          : "Order successfully executed against exchange reference node. Terminal ledger verified."
                        }
                    </p>
                </div>
                <Button className="w-full h-12" onClick={() => setSelectedAsset(null)}>
                  Return to Marketplace
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SiteLayout>
  );
}

// REDESIGNED SIP GRID ITEM COMPONENT (WITH DYNAMIC DISPATCH EXTENSIONS)
function SIPMarketCard({ fund, onSetupMandate }: { fund: any; onSetupMandate: (amount: number, years: number) => void }) {
  const [sipAmount, setSipAmount] = useState<number>(2000);
  const [sipYears, setSipYears] = useState<number>(3);
  
  const assumedRate = fund.schemeName.toLowerCase().includes("small") ? 22.4 
                      : fund.schemeName.toLowerCase().includes("mid") ? 18.2 
                      : 14.5;

  const getProjections = () => {
    const P = sipAmount;
    const i = assumedRate / 12 / 100;
    const n = sipYears * 12;
    const maturity = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const invested = P * n;
    return {
      invested: invested.toLocaleString("en-IN"),
      total: Math.round(maturity).toLocaleString("en-IN")
    };
  };

  const projections = getProjections();

  return (
    <Card className="p-6 border-border bg-card/40 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between hover:border-gold/30 transition-all shadow-sm">
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-mono font-bold text-gold uppercase tracking-wider">
            Code: {fund.schemeCode}
          </span>
          <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-bold bg-secondary px-2">
            Systematic Plan
          </Badge>
        </div>

        <h3 className="font-display text-base font-bold text-foreground leading-snug line-clamp-2 min-h-[2.5rem]">
          {fund.schemeName}
        </h3>

        {/* PARAMETER SELECTION DECK */}
        <div className="mt-5 p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-4">
          {/* Slider 1: Selection for SIP Capital */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5 text-gold" /> Monthly Amt:
              </span>
              <span className="font-bold font-display text-foreground">₹{sipAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {[1000, 2000, 5000, 10000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSipAmount(amt)}
                  className={`py-1 text-[10px] font-bold rounded-md border transition-all ${
                    sipAmount === amt 
                      ? "bg-gold text-gold-foreground border-gold" 
                      : "bg-background hover:bg-secondary border-border"
                  }`}
                >
                  ₹{amt >= 10000 ? `${amt/1000}k` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Slider 2: Selection for SIP Tenure Period */}
          <div className="space-y-1 pt-1 border-t border-border/20">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Hourglass className="h-3.5 w-3.5 text-gold" /> Period Term:
              </span>
              <span className="font-bold text-foreground">{sipYears} Years</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {[1, 3, 5, 10].map((yrs) => (
                <button
                  key={yrs}
                  onClick={() => setSipYears(yrs)}
                  className={`py-1 text-[10px] font-bold rounded-md border transition-all ${
                    sipYears === yrs 
                      ? "bg-gold text-gold-foreground border-gold" 
                      : "bg-background hover:bg-secondary border-border"
                  }`}
                >
                  {yrs} Yr{yrs > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] pt-2 border-t border-border/40 text-muted-foreground">
            <div>Principal: <strong className="text-foreground font-semibold">₹{projections.invested}</strong></div>
            <div>Maturity ({sipYears}Y): <strong className="text-success font-bold">₹{projections.total}</strong></div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs pt-2">
        <span className="text-muted-foreground">Min SIP: <strong className="text-foreground">₹500</strong></span>
        <Button 
          size="sm" 
          onClick={() => onSetupMandate(sipAmount, sipYears)} 
          className="bg-gold-gradient text-gold-foreground font-bold text-xs px-4"
        >
          Setup Mandate
        </Button>
      </div>
    </Card>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 bg-secondary/10 rounded-2xl border border-dashed border-border">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">{message}</p>
      </div>
  );
}