import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Upload, FileCheck, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/kyc")({
  // Standardized to handle both boolean and string "true"
  validateSearch: (search: Record<string, unknown>) => {
    return {
      onboarding: search.onboarding === "true" || search.onboarding === true || false,
    };
  },
  head: () => ({ meta: [{ title: "Submit KYC — RoyalOak Fintech" }] }),
  component: KYC,
});

function KYC() {
  const { onboarding } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", pan: "", aadhaar: "" });
  const [loading, setLoading] = useState(false);
  
  const [addressProofBase64, setAddressProofBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("File is too large. Please select an image under 1MB.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAddressProofBase64(reader.result as string);
      toast.success("Document attached successfully");
    };
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!addressProofBase64) {
      toast.error("Please upload a proof of address document.");
      return;
    }

    setLoading(true);
    try {
      // Use { merge: true } to prevent accidental overwrites of existing user fields
      await setDoc(doc(db, "kyc", user.uid), {
        ...form,
        addressProofBase64,
        userId: user.uid,
        status: "submitted",
        submittedAt: serverTimestamp(),
      }, { merge: true });
      
      toast.success("KYC submitted successfully");
      
      // Navigate using explicit boolean to match onboarding flow
      if (onboarding) {
        navigate({ to: "/risk-assessment", search: { onboarding: true } });
      } else {
        navigate({ to: "/profile" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit KYC");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onboarding) {
      // Force the onboarding state to stay true during the skip teleport
      navigate({ to: "/risk-assessment", search: { onboarding: true } });
    } else {
      navigate({ to: "/profile" });
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold-gradient text-gold-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Submit KYC</h1>
            <p className="text-sm text-muted-foreground">Verification required for investment access.</p>
          </div>
        </div>

        <form className="grid gap-6 rounded-2xl border border-border bg-card p-8 shadow-elegant" onSubmit={submit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Full Name</Label><Input value={form.name} onChange={(e)=>set("name",e.target.value)} required placeholder="As per Aadhaar" /></div>
            <div><Label>Email Address</Label><Input value={form.email} disabled className="bg-muted/50" /></div>
            <div><Label>Mobile Number</Label><Input value={form.mobile} onChange={(e)=>set("mobile",e.target.value)} required placeholder="+91" /></div>
            <div><Label>PAN Card Number</Label><Input value={form.pan} onChange={(e)=>set("pan",e.target.value)} required placeholder="ABCDE1234F" /></div>
            <div className="md:col-span-2">
              <Label>Aadhaar Number</Label>
              <Input 
                value={form.aadhaar} 
                onChange={(e)=>set("aadhaar",e.target.value)} 
                required 
                placeholder="12-digit number"
                maxLength={12}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Proof of Address (Aadhaar Front/Back)</Label>
            <label className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all px-4 py-8 text-sm
              ${addressProofBase64 ? 'border-green-500/50 bg-green-500/5' : 'border-border bg-secondary/50 hover:border-gold hover:text-foreground'}`}>
              
              {addressProofBase64 ? (
                <>
                  <FileCheck className="h-8 w-8 text-green-500" />
                  <span className="font-medium text-foreground">{fileName}</span>
                  <span className="text-xs text-muted-foreground">Click to change file</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span>Click to upload JPEG or PNG (Max 1MB)</span>
                </>
              )}
              
              <input type="file" className="hidden" accept="image/jpeg,image/png" onChange={handleFileChange} />
            </label>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <Button 
              disabled={loading} 
              type="submit"
              className="h-12 w-full bg-gold-gradient text-gold-foreground font-semibold shadow-lg hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </span>
              ) : "Confirm & Submit KYC"}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleSkip} 
              className="text-muted-foreground hover:text-foreground h-11"
            >
              Skip for now
            </Button>
          </div>
        </form>
      </div>
    </SiteLayout>
  );
}