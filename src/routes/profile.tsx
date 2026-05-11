import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShieldCheck, 
  LogOut, 
  Loader2, 
  Save, 
  Trash2, 
  AlertTriangle 
} from "lucide-react";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { updateProfile, deleteUser } from "firebase/auth";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", mobile: "", kycStatus: "Not Started" });

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const kycDoc = await getDoc(doc(db, "kyc", user.uid));
      
      const userData = userDoc.data() || {};
      const kycData = kycDoc.data() || {};

      setProfile({
        name: userData.name || user.displayName || "",
        email: userData.email || user.email || "",
        mobile: userData.mobile || "",
        kycStatus: kycData.status || "Not Started",
      });
    };
    fetchData();
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user, { displayName: profile.name });
      await updateDoc(doc(db, "users", user.uid), {
        name: profile.name,
        mobile: profile.mobile,
      });
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error("Update failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const uid = user.uid;
      // 1. Delete data from Firestore collections
      await deleteDoc(doc(db, "users", uid));
      await deleteDoc(doc(db, "kyc", uid));
      
      // 2. Delete the Firebase Auth user
      await deleteUser(user);
      
      toast.success("Account deleted successfully");
      navigate({ to: "/" });
    } catch (err: any) {
      if (err.code === "auth/requires-recent-login") {
        toast.error("Security: Please log out and log back in to delete your account.");
      } else {
        toast.error("Error: " + err.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
    toast.success("Logged out safely");
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground">Manage your identity and security preferences.</p>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-secondary/50 p-1">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="kyc">KYC Status</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-16 w-16 rounded-full bg-gold-gradient grid place-items-center text-2xl font-bold text-gold-foreground">
                  {profile.name.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="text-xl font-medium">{profile.name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input value={profile.mobile} onChange={(e) => setProfile({...profile, mobile: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Email (Primary)</Label>
                  <Input value={profile.email} disabled className="bg-muted/50" />
                </div>
              </div>

              <Button onClick={handleUpdateProfile} className="mt-8 bg-gold-gradient text-gold-foreground" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="kyc" className="mt-6">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-gold mb-4" />
              <h3 className="text-xl font-medium mb-2">Verification Status</h3>
              <div className={`mx-auto inline-flex items-center rounded-full px-4 py-1 text-sm font-medium 
                ${profile.kycStatus === 'submitted' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                {profile.kycStatus.toUpperCase()}
              </div>
              <p className="mt-4 text-sm text-muted-foreground max-w-sm mx-auto">
                {profile.kycStatus === 'submitted' 
                  ? "Your documents are currently under review. This usually takes 24-48 hours."
                  : "Please complete your KYC to unlock all investing features."}
              </p>
              {profile.kycStatus !== 'submitted' && (
                <Button 
                  onClick={() => navigate({
                    to: '/kyc',
                    search: { onboarding: false } // Explicitly set to false here
                  })} 
                  className="mt-6 border-gold text-gold" 
                  variant="outline"
                >
                  Complete KYC
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-6 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
              <h3 className="text-lg font-medium mb-4">Security Preferences</h3>
              <p className="text-sm text-muted-foreground mb-6">Manage your password and authentication methods.</p>
              <Button variant="outline">Change Password</Button>
            </div>

            {/* DANGER ZONE */}
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 shadow-sm">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-lg font-medium">Account Deletion</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Deleting your account will remove all your investment history and KYC documents. This action is irreversible.
              </p>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" /> Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your RoyalOak account and all associated data. You will lose access to your portfolio and verification status immediately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Processing..." : "Yes, Delete Everything"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}