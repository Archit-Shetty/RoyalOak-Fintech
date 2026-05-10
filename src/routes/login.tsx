import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — RoyalOak Fintech" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Signed in with Google");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed");
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-6 py-20">
        <h1 className="font-display text-4xl">Welcome back.</h1>
        <p className="mt-2 text-muted-foreground">Log in to your portfolio.</p>
        <div className="mt-8 grid gap-3">
          <Button variant="outline" className="h-11" onClick={handleGoogle}>Continue with Google</Button>
        </div>
        <div className="my-8 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" required /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" required /></div>
          <Button disabled={loading} className="h-11 bg-gold-gradient text-gold-foreground hover:opacity-90">{loading ? "Logging in..." : "Log in"}</Button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">New here? <Link to="/register" className="font-medium text-foreground underline">Create account</Link></p>
      </div>
    </SiteLayout>
  );
}
