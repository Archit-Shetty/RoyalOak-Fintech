import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { sendOtpToEmail, verifyOtpCode } from "@/lib/otp-service";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — RoyalOak Fintech" }] }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [otpStage, setOtpStage] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleStartVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    if (!isValidEmail(form.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      const response = await sendOtpToEmail(form.email);
      setOtpSessionId(response.sessionId);
      setOtpStage(true);
      toast.success("OTP sent to your email.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send OTP.");
    }
  };

  const finishRegistration = async () => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);

      try {
        await setDoc(doc(db, "users", cred.user.uid), {
          name: form.name,
          email: form.email,
          createdAt: serverTimestamp(),
          portfolio: {
            totalValue: 0,
            todaysPl: 0,
            invested: 0,
            xirr: 0,
            history: [],
          },
          allocation: [],
          holdings: [],
        });
      } catch (firestoreErr: any) {
        console.warn("Failed to save user data to Firestore:", firestoreErr);
      }

      toast.success("Account created!");
      navigate({ to: "/kyc" });
    } catch (err: any) {
      if (err?.code === "auth/email-already-in-use") {
        toast.error("Email already exists. Please login instead.");
      } else if (err?.code === "auth/weak-password") {
        toast.error("Password too weak. Use at least 6 characters.");
      } else if (err?.code === "auth/invalid-email") {
        toast.error("Please enter a valid email address.");
      } else if (err?.code === "auth/missing-email") {
        toast.error("Please enter your email address.");
      } else if (err?.code === "auth/missing-password") {
        toast.error("Please enter a password.");
      } else {
        toast.error(err.message ?? "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSessionId) {
      toast.error("Unable to verify OTP. Please request a new code.");
      return;
    }

    const result = await verifyOtpCode(otpSessionId, enteredOtp);
    if (!result.success) {
      if (result.reason === "expired") {
        toast.error("OTP expired. Please request a new code.");
        setOtpStage(false);
        setOtpSessionId(null);
      } else if (result.reason === "invalid_otp") {
        toast.error("OTP does not match. Please try again.");
      } else {
        toast.error("Unable to verify OTP. Please try again.");
      }
      return;
    }

    await finishRegistration();
  };

  const handleResendOtp = async () => {
    try {
      const response = await sendOtpToEmail(form.email);
      setOtpSessionId(response.sessionId);
      setEnteredOtp("");
      toast.success("OTP resent.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to resend OTP.");
    }
  };

  const handleGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      
      // Try to save user data to Firestore, but don't fail registration if it doesn't work
      try {
        await setDoc(doc(db, "users", cred.user.uid), {
          name: cred.user.displayName,
          email: cred.user.email,
          createdAt: serverTimestamp(),
          portfolio: {
            totalValue: 0,
            todaysPl: 0,
            invested: 0,
            xirr: 0,
            history: [],
          },
          allocation: [],
          holdings: [],
        }, { merge: true });
      } catch (firestoreErr: any) {
        console.warn("Failed to save user data to Firestore:", firestoreErr);
        // Continue with registration even if Firestore fails
      }
      
      toast.success("Account created!");
      navigate({ to: "/kyc" });
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-up failed");
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-6 py-20">
        <h1 className="font-display text-4xl">Open your account.</h1>
        <p className="mt-2 text-muted-foreground">Takes less than 2 minutes.</p>

        {!otpStage ? (
          <>
            <div className="mt-8 grid gap-3">
              <Button variant="outline" className="h-11" onClick={handleGoogle}>Sign up with Google</Button>
            </div>
            <div className="my-8 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
            </div>
            <form className="grid gap-4" onSubmit={handleStartVerification}>
              <div><Label>Full name</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Doe" required /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" required /></div>
              <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" required minLength={6} /></div>
              <Button disabled={loading} className="h-11 bg-gold-gradient text-gold-foreground hover:opacity-90">Send OTP</Button>
            </form>
          </>
        ) : (
          <form className="grid gap-6" onSubmit={handleVerifyOtp}>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
              <p className="text-sm text-muted-foreground">We sent a 6-digit verification code to:</p>
              <p className="mt-2 font-medium">{form.email}</p>
              <p className="mt-1 text-sm text-muted-foreground">Check your email for the verification code.</p>
              <div className="mt-6">
                <Label>Enter OTP</Label>
                <InputOTP
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(value) => setEnteredOtp(value)}
                  containerClassName="mt-3"
                  render={({ slots }) => (
                    <div className="flex gap-2">
                      {slots.map((slot, index) => (
                        <div
                          key={index}
                          className={`relative flex h-11 w-11 items-center justify-center rounded-lg border border-border text-base font-medium transition ${slot.isActive ? "ring-2 ring-ring" : ""}`}
                        >
                          <span>{slot.char ?? slot.placeholderChar}</span>
                          {slot.hasFakeCaret && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                              <div className="h-4 w-px animate-caret-blink bg-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>OTP sent to your email.</span>
                <button type="button" className="underline text-foreground" onClick={handleResendOtp}>Resend OTP</button>
              </div>
            </div>
            <Button disabled={loading} className="h-11 bg-gold-gradient text-gold-foreground hover:opacity-90">Verify OTP and Continue</Button>
          </form>
        )}

        <p className="mt-6 text-sm text-muted-foreground">Already have an account? <Link to="/login" className="font-medium text-foreground underline">Log in</Link></p>
      </div>
    </SiteLayout>
  );
}
