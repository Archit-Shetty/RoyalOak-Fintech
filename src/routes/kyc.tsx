import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/kyc")({
  head: () => ({ meta: [{ title: "Submit KYC — RoyalOak Fintech" }] }),
  component: KYC,
});

function KYC() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", pan: "", aadhaar: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      const d = snap.data() ?? {};
      setForm((f) => ({
        ...f,
        name: d.name ?? user.displayName ?? "",
        email: d.email ?? user.email ?? "",
        mobile: d.mobile ?? "",
        pan: d.pan ?? "",
        aadhaar: d.aadhaar ?? "",
      }));
    });
  }, [user]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "kyc", user.uid), {
        ...form,
        userId: user.uid,
        status: "submitted",
        submittedAt: serverTimestamp(),
      });
      toast.success("KYC submitted");
      navigate({ to: "/risk-assessment" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold-gradient text-gold-foreground"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <h1 className="font-display text-3xl">Submit KYC</h1>
            <p className="text-sm text-muted-foreground">Verified instantly via DigiLocker.</p>
          </div>
        </div>
        <form className="grid gap-5 rounded-2xl border border-border bg-card p-8 shadow-elegant" onSubmit={submit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Name</Label><Input value={form.name} onChange={(e)=>set("name",e.target.value)} required /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e)=>set("email",e.target.value)} required /></div>
            <div><Label>Mobile</Label><Input value={form.mobile} onChange={(e)=>set("mobile",e.target.value)} required /></div>
            <div><Label>PAN No.</Label><Input value={form.pan} onChange={(e)=>set("pan",e.target.value)} required /></div>
            <div className="md:col-span-2"><Label>Aadhaar No.</Label><Input value={form.aadhaar} onChange={(e)=>set("aadhaar",e.target.value)} required /></div>
          </div>
          <div>
            <Label>Attach proof of address</Label>
            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/50 px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-gold hover:text-foreground">
              <Upload className="h-4 w-4" /> Choose file or drag here
              <input type="file" className="hidden" />
            </label>
          </div>
          <Button disabled={loading} className="h-11 bg-gold-gradient text-gold-foreground hover:opacity-90">{loading ? "Submitting..." : "Submit KYC"}</Button>
        </form>
      </div>
    </SiteLayout>
  );
}
