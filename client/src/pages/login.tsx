import { Link, useLocation } from "wouter";
import { ArrowRight, ShieldCheck, Sparkles, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const {
    login,
    register,
    resendVerification,
    forgotPassword,
    isLoggingIn,
    isRegistering,
    isResendingVerification,
    isSendingForgotPassword,
    user,
  } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showResendVerification, setShowResendVerification] = useState(false);

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
      setShowResendVerification(message.toLowerCase().includes("not verified"));
      toast({ title: "Login failed", description: message, variant: "destructive" });
    }
  };

  const handleRegister = async () => {
    try {
      await register({ email, password, firstName, lastName });
      toast({
        title: "Registration successful!",
        description: "Please check your email and confirm your account, then sign in.",
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
    setShowResendVerification(false);
    if (newMode === "register") {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-16 border-b border-white/20 bg-gradient-to-r from-[#203f9f] via-[#2757ca] to-[#2f67eb]">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/35 bg-white/10 font-bold">
              F
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight">FormFlow AI</span>
          </Link>
          <Button asChild variant="secondary" className="border border-white/35 bg-white/15 text-white hover:bg-white/25">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center md:px-6">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#4d5e84]">Workspace Access</p>
          <h1 className="text-4xl font-display font-bold leading-tight text-[#162544] md:text-5xl">
            {mode === "login" ? "Access your form workspace." : "Create your form workspace."}
          </h1>
          <p className="text-lg text-[#5a6a89]">
            Manage forms, templates, and submissions in one clean dashboard experience.
          </p>
          <div className="grid gap-3 text-sm text-[#627495] sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-2xl border border-[#cfdaef] bg-white/75 px-3 py-3">
              <Sparkles className="h-4 w-4 text-[#2d62e6]" />
              AI-powered builder
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[#cfdaef] bg-white/75 px-3 py-3">
              <ShieldCheck className="h-4 w-4 text-[#2d62e6]" />
              Secure auth
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#cbd7ee] bg-white p-8 shadow-[0_18px_40px_rgba(26,55,120,0.12)]">
          <div className="mb-2 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-display font-semibold text-[#1e2d4d]">
              {mode === "login" ? "Sign in" : "Create account"}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#49629b] hover:bg-[#edf2ff] hover:text-[#1f376d]"
              onClick={() => handleModeSwitch(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Create account" : "Use existing"}
            </Button>
          </div>
          <p className="text-sm text-[#6a7997]">
            {mode === "login" ? "Use your email and password." : "Start with name, email, and password."}
          </p>

          <div className="mt-6 space-y-4">
            {mode === "register" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#2c3e63]">First name</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#2c3e63]">Last name</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                </div>
              </div>
            ) : null}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#2c3e63]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7e9e]" />
                <Input className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#2c3e63]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7e9e]" />
                <Input className="pl-9" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </div>

            {mode === "login" ? (
              <>
                <Button onClick={handleLogin} disabled={isLoggingIn} className="w-full rounded-xl">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    if (!email) {
                      toast({ title: "Email required", description: "Enter your email first.", variant: "destructive" });
                      return;
                    }
                    try {
                      await forgotPassword({ email });
                      toast({ title: "Reset link sent", description: "Check your email for password reset instructions." });
                    } catch (error) {
                      toast({
                        title: "Request failed",
                        description: error instanceof Error ? error.message : "Failed to request password reset.",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={isSendingForgotPassword}
                  className="w-full rounded-xl"
                >
                  {isSendingForgotPassword ? "Sending..." : "Forgot password?"}
                </Button>
                {showResendVerification ? (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await resendVerification({ email });
                        toast({ title: "Verification sent", description: "Check your inbox for the new verification email." });
                      } catch (error) {
                        toast({
                          title: "Resend failed",
                          description: error instanceof Error ? error.message : "Could not resend verification email.",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={isResendingVerification || !email}
                    className="w-full rounded-xl"
                  >
                    {isResendingVerification ? "Sending..." : "Resend Verification Email"}
                  </Button>
                ) : null}
              </>
            ) : (
              <Button onClick={handleRegister} disabled={isRegistering} className="w-full rounded-xl">
                Create account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            <p className="text-xs text-[#7180a0]">
              {mode === "login" ? "No account yet? Create one in seconds." : "Already have an account? Sign in."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
