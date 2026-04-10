import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, company_name: company },
      },
    });
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast({ title: "Failed", description: String(result.error), variant: "destructive" });
    if (!result.redirected && !result.error) navigate("/dashboard");
  };

  const handleApple = async () => {
    const result = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
    if (result.error) toast({ title: "Failed", description: String(result.error), variant: "destructive" });
    if (!result.redirected && !result.error) navigate("/dashboard");
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4 bg-card p-8 rounded-xl border border-border">
          <CheckCircle className="w-16 h-16 text-success mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
          <p className="text-muted-foreground">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your 7-day free trial.</p>
          <Button variant="outline" onClick={() => navigate("/login")}>Back to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3 cursor-pointer" onClick={() => navigate("/")}>
          <p className="text-xs font-medium tracking-[0.35em] uppercase text-primary/70">Join</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
            <span className="bg-gradient-to-r from-[hsl(174,62%,55%)] via-[hsl(200,80%,65%)] to-[hsl(217,91%,60%)] bg-clip-text text-transparent drop-shadow-[0_0_30px_hsl(174,62%,50%,0.3)]">
              HostFlow AI
            </span>
          </h1>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" />
            <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-medium">Premium Experience</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" />
          </div>
          <p className="text-base font-medium text-muted-foreground italic">"Built for visionaries like you — your empire starts here."</p>
          <p className="text-sm text-primary font-semibold">Enjoy full access for 7 days — no credit card required</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-6 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleGoogle} className="w-full">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </Button>
            <Button variant="outline" onClick={handleApple} className="w-full">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Apple
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or sign up with email</span></div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={8} />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Start Free Trial
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
