import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { TrendingUp, User } from "lucide-react"; // Replaced LogOut with User icon
import { useAuth } from "@/lib/auth-context";

const links = [
  { to: "/", label: "Home" },
  { to: "/investments", label: "Investments" },
  { to: "/advisory", label: "Advisory" },
  { to: "/blog", label: "Insights" },
  { to: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold-gradient text-gold-foreground shadow-gold">
            <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span>RoyalOak<span className="text-gold-gradient">.</span></span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to as any}
              activeProps={{ className: "text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="text-sm font-medium transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              
              {/* Account Pill */}
              <Link 
                to="/profile" 
                className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 transition-all hover:border-gold/50 hover:bg-secondary"
              >
                <div className="h-6 w-6 rounded-full bg-gold-gradient flex items-center justify-center text-[10px] font-bold text-gold-foreground">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </div>
                <span className="text-sm font-medium">Account</span>
              </Link>
            </div>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="bg-gold-gradient text-gold-foreground hover:opacity-90">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}