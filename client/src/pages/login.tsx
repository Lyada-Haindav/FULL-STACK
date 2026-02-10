import { Link, useLocation } from "wouter";
import { ArrowRight, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
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

  // Redirect when user is authenticated
  useEffect(() => {
    console.log('Login page - user state changed:', user);
    if (user) {
      console.log('Login page - redirecting to root');
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleLogin = async () => {
    try {
      const result = await login({ email, password });
      console.log('Login result:', result);
      toast({ title: "Login successful", description: "Redirecting to dashboard..." });
      
      // Force immediate redirect to bypass auth state issues temporarily
      console.log('Forcing immediate redirect to root');
      window.location.href = "/";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Check your credentials and try again.";
      toast({ title: "Login failed", description: message, variant: "destructive" });
    }
  };

  const handleRegister = async () => {
    try {
      const result = await register({ email, password, firstName, lastName });
      console.log('Register result:', result);
      
      // Always show email confirmation message for development
      // Supabase always requires email confirmation by default
      toast({ 
        title: "Registration successful!", 
        description: "Please check your email to confirm your account, then login.", 
        variant: "default" 
      });
      
      // Switch to login mode and keep form data for the helpful message
      setMode("login");
      
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed. Please try again.";
      toast({ title: "Registration failed", description: message, variant: "destructive" });
    }
  };

  const handleModeSwitch = (newMode: "login" | "register") => {
    setMode(newMode);
    // Clear form data when switching to register mode
    if (newMode === "register") {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f9f5ef,transparent_55%),radial-gradient(circle_at_20%_20%,#dff5f3,transparent_40%),radial-gradient(circle_at_80%_10%,#ffe7cf,transparent_35%)] text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display text-xl">
            <span className="h-9 w-9 rounded-xl bg-foreground text-background flex items-center justify-center font-bold">F</span>
            FormFlow AI
          </Link>
          <Button asChild variant="ghost">
            <Link href="/">Back to Home</Link>
          </Button>
        </header>

        <div className="grid lg:grid-cols-2 gap-10 mt-16 items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Welcome</p>
            <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
              {mode === "login" ? "Sign in to your FormFlow AI workspace." : "Create your FormFlow AI account."}
            </h1>
            <p className="text-muted-foreground text-lg">
              Build beautiful, accurate forms with AI assistance, curated templates, and real-time response insights.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI templates</div>
              <div className="flex items-center gap-2"><Wand2 className="h-4 w-4" /> Smart builder</div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Secure data</div>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur border border-border rounded-3xl p-8 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-semibold">{mode === "login" ? "Sign in" : "Create account"}</h2>
              <Button variant="ghost" size="sm" onClick={() => handleModeSwitch(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "Create account" : "Use existing"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === "login" ? "Use your email and password." : "Start with a name, email, and password."}
            </p>
            <div className="mt-6 space-y-4">
              {/* Email confirmation message */}
              {mode === "login" && firstName && lastName && email && !isLoggingIn && !isRegistering && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
                      <div>
                        <p className="text-sm font-medium text-green-800">Check your email!</p>
                        <p className="text-xs text-green-600">We sent a confirmation link to {email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setFirstName("");
                        setLastName("");
                        setEmail("");
                        setPassword("");
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      Clear
                    </Button>
                  </div>
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
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
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
