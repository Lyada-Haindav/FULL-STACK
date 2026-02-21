import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type VerifyState = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("Checking your verification link...");
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token")?.trim() ?? "";
    const status = params.get("status")?.trim();

    if (status === "success") {
      setState("success");
      setMessage("Your email is verified. You can sign in now.");
      return;
    }

    if (!token) {
      setState("error");
      setMessage("Verification link is invalid or expired.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((payload as { message?: string }).message || "Verification failed.");
        }

        setState("success");
        setMessage((payload as { message?: string }).message || "Email verified successfully.");
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Verification failed.");
      }
    };

    verify();
  }, []);

  const handleResend = async () => {
    const email = resendEmail.trim();
    if (!email) {
      setMessage("Enter your email to resend verification.");
      setState("error");
      return;
    }

    setIsResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((payload as { message?: string }).message || "Could not resend verification.");
      }

      setMessage((payload as { message?: string }).message || "Verification email sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not resend verification.");
    } finally {
      setIsResending(false);
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
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center px-4 py-12 md:px-6">
        <section className="w-full rounded-3xl border border-[#cbd7ee] bg-white p-8 shadow-[0_18px_40px_rgba(26,55,120,0.12)]">
          <div className="mb-6 flex items-center gap-3">
            {state === "loading" ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#2d62e6]" />
            ) : null}
            {state === "success" ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            ) : null}
            {state === "error" ? (
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            ) : null}
            <h1 className="text-2xl font-display font-semibold text-[#1e2d4d]">Email Verification</h1>
          </div>

          <p className="text-[#56668a]">{message}</p>

          {state === "error" ? (
            <div className="mt-6 space-y-3 rounded-2xl border border-[#d9e2f4] bg-[#f8faff] p-4">
              <label className="block text-sm font-medium text-[#2c3e63]">Resend verification email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7e9e]" />
                <Input
                  className="pl-9"
                  placeholder="you@company.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleResend} disabled={isResending} className="rounded-xl">
                {isResending ? "Sending..." : "Resend verification"}
              </Button>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild className="rounded-xl">
              <Link href="/login">{state === "success" ? "Continue to login" : "Go to login"}</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

