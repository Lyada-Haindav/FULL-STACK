import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { AlertTriangle, CheckCircle2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ResetState = "idle" | "submitting" | "success" | "error";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = params.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<ResetState>("idle");
  const [message, setMessage] = useState("Set a new password for your account.");

  const handleSubmit = async () => {
    if (!token) {
      setState("error");
      setMessage("This reset link is invalid or expired.");
      return;
    }

    if (password.trim().length < 6) {
      setState("error");
      setMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setState("error");
      setMessage("Passwords do not match.");
      return;
    }

    setState("submitting");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((payload as { message?: string }).message || "Password reset failed.");
      }

      setState("success");
      setMessage((payload as { message?: string }).message || "Password reset successful.");
      setTimeout(() => setLocation("/login"), 1200);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Password reset failed.");
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
            {state === "submitting" ? <Loader2 className="h-6 w-6 animate-spin text-[#2d62e6]" /> : null}
            {state === "success" ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : null}
            {state === "error" ? <AlertTriangle className="h-6 w-6 text-amber-600" /> : null}
            {state === "idle" ? <Lock className="h-6 w-6 text-[#2d62e6]" /> : null}
            <h1 className="text-2xl font-display font-semibold text-[#1e2d4d]">Reset Password</h1>
          </div>

          <p className="text-[#56668a]">{message}</p>

          {state !== "success" ? (
            <div className="mt-6 space-y-4 rounded-2xl border border-[#d9e2f4] bg-[#f8faff] p-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#2c3e63]">New password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#2c3e63]">Confirm password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retype password"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </div>
              <Button onClick={handleSubmit} disabled={state === "submitting"} className="rounded-xl">
                {state === "submitting" ? "Updating..." : "Update password"}
              </Button>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild className="rounded-xl">
              <Link href="/login">Go to login</Link>
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
