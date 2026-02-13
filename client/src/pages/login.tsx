import { Link, useLocation } from "wouter";
import { ArrowRight, ShieldCheck, Sparkles, Wand2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { login, register, isLoggingIn, isRegistering, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleLogin = async () => {
    try {
      await login({ email, password });
      toast({ title: "Login successful", description: "Redirecting to dashboard..." });
      window.location.href = "/";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Check your credentials and try again.";
      toast({ title: "Login failed", description: message, variant: "destructive" });
    }
  };

  const handleRegister = async () => {
    try {
      await register({ email, password, firstName, lastName });
      toast({
        title: "Registration successful!",
        description: "Please check your email to confirm your account, then login.",
        variant: "default",
      });
      setMode("login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed. Please try again.";
      toast({ title: "Registration failed", description: message, variant: "destructive" });
    }
  };

  const handleModeSwitch = (newMode: "login" | "register") => {
    setMode(newMode);
    if (newMode === "register") {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen text-foreground bg-[radial-gradient(900px_600px_at_20%_-10%,rgba(248,197,73,0.18),transparent_60%),radial-gradient(800px_500px_at_90%_0%,rgba(34,211,238,0.18),transparent_60%),radial-gradient(1000px_700px_at_50%_120%,rgba(59,130,246,0.18),transparent_60%)]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-display text-xl">
            <span className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold">F</span>
            FormFlow AI
          </Link>
          <Button asChild variant="ghost">
            <Link href="/">Back to Home</Link>
          </Button>
        </header>

        <div className="grid lg:grid-cols-2 gap-12 mt-16 items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Access</p>
            <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
              {mode === "login" ? "Enter your FormFlow workspace." : "Create your FormFlow workspace."}
            </h1>
            <p className="text-muted-foreground text-lg">
              Build premium forms with AI assistance, file uploads, and real‑time response insights.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI templates</div>
              <div className="flex items-center gap-2"><Wand2 className="h-4 w-4" /> Smart builder</div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Secure data</div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-8 premium-shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-semibold">{mode === "login" ? "Sign in" : "Create account"}</h2>
              <Button variant="ghost" size="sm" onClick={() => handleModeSwitch(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "Create account" : "Use existing"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === "login" ? "Use your email and password." : "Start with a name, email, and password."}
            </p>

            <div className="mt-6 space-y-4">
              {mode === "login" && firstName && lastName && email && !isLoggingIn && !isRegistering && (
                <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4">
                  <p className="text-sm font-medium text-emerald-200">Check your email!</p>
                  <p className="text-xs text-emerald-200/80">We sent a confirmation link to {email}</p>
                </div>
              )}

              {mode === "register" && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">First name</label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last name</label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                  </div>
                </div>
              )}

              <div className="relative">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                </div>
              </div>
              <div className="relative">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </div>

              {mode === "login" ? (
                <Button onClick={handleLogin} disabled={isLoggingIn} className="w-full rounded-full">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleRegister} disabled={isRegistering} className="w-full rounded-full">
                  Create account <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                {mode === "login" ? "No account yet? Create one in seconds." : "Already have an account? Sign in."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
