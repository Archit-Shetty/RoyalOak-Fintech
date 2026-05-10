import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="font-display text-2xl">RoyalOak<span className="text-gold-gradient">.</span></div>
          <p className="mt-3 text-sm text-primary-foreground/70 max-w-xs">
            Wealth advisory and investment intelligence for the modern investor.
          </p>
        </div>
        <FooterCol title="Products" links={[["/investments","Mutual Funds"],["/investments","SIPs"],["/investments","Stocks"],["/investments","Insurance"]]} />
        <FooterCol title="Company" links={[["/advisory","Advisory"],["/blog","Insights"],["/pricing","Pricing"],["/contact","Contact"]]} />
        <FooterCol title="Legal" links={[["/privacy","Privacy"],["/terms","Terms"],["/disclosures","Disclosures"]]} />
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-primary-foreground/60 md:flex-row">
          <span>© {new Date().getFullYear()} RoyalOak Fintech. All rights reserved.</span>
          <span>SEBI Reg • BSE Star MF Distributor</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-gradient">{title}</div>
      <ul className="space-y-2 text-sm text-primary-foreground/75">
        {links.map(([to, label]) => (
          <li key={label}><Link to={to as any} className="hover:text-primary-foreground">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
