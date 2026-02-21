import { Link } from "wouter";
import { ArrowRight, Sparkles, ShieldCheck, Wand2, LayoutTemplate, BarChart3, Bot, UploadCloud, CheckCircle2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed z-50 w-full border-b border-white/20 bg-gradient-to-r from-[#203f9f] via-[#2757ca] to-[#2f67eb]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-3 text-white">
              <div className="h-10 w-10 rounded-2xl border border-white/35 bg-white/10 text-white flex items-center justify-center font-bold">F</div>
              <span className="font-display font-bold text-2xl tracking-tight">FormFlow AI</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#templates" className="text-sm font-semibold text-white/85 hover:text-white transition-colors">Templates</a>
              <a href="#ai" className="text-sm font-semibold text-white/85 hover:text-white transition-colors">AI Studio</a>
              <a href="#workflow" className="text-sm font-semibold text-white/85 hover:text-white transition-colors">Workflow</a>
              <Button asChild variant="secondary" className="rounded-full border border-white/35 bg-white/15 text-white hover:bg-white/25 px-5">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="rounded-full bg-white text-[#1f3f99] hover:bg-white/90 px-6">
                <Link href="/login">Start Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 md:pt-36 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight">
                Build FormFlow‑grade forms with AI, templates, and zero setup.
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                FormFlow AI turns prompts into production‑ready multi‑step forms with uploads, validation, and analytics. Customize fast and publish instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/login">Launch Builder <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground pt-6">
                <div className="flex items-center gap-2"><Wand2 className="h-4 w-4" /> AI structured</div>
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Secure by design</div>
                <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Response analytics</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass-card rounded-3xl p-6 premium-shadow">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">AI Form Preview</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary">Live</span>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-border/60 bg-card p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 1</p>
                    <p className="font-semibold">Customer Fit</p>
                    <div className="mt-3 space-y-2">
                      <div className="h-10 rounded-xl bg-muted/40" />
                      <div className="h-10 rounded-xl bg-muted/30" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 2</p>
                    <p className="font-semibold">Uploads & Details</p>
                    <div className="mt-3 h-20 rounded-xl bg-muted/30" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Bot className="h-4 w-4" /> Generated with Gemini
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Uploads", icon: <UploadCloud className="h-4 w-4" /> },
                  { label: "Validation", icon: <CheckCircle2 className="h-4 w-4" /> },
                  { label: "Multi‑step", icon: <Layers className="h-4 w-4" /> },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/60 bg-card p-3 text-xs text-muted-foreground flex items-center gap-2">
                    {item.icon} {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Templates</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold mt-2">Start from proven frameworks.</h2>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/login">Browse All Templates</Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Client Intake", desc: "Onboard clients with clarity and required documents." },
              { title: "Product Feedback", desc: "Collect feature requests and satisfaction ratings." },
              { title: "Hiring Pipeline", desc: "Multi‑step applications for talent screening." },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-border/60 bg-card p-6 premium-shadow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LayoutTemplate className="h-4 w-4" /> Template
                </div>
                <h3 className="text-xl font-semibold mt-4">{card.title}</h3>
                <p className="text-muted-foreground mt-2">{card.desc}</p>
                <Button asChild size="sm" className="rounded-full mt-4">
                  <Link href="/login">Use Template</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section id="ai" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">AI Studio</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold">Accuracy‑first AI you can trust.</h2>
              <p className="text-muted-foreground text-lg">
                We normalize every response so it matches the builder schema—no broken fields, no missing placeholders, just clean structured output.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/60 bg-card p-4">
                  <p className="font-semibold">Schema‑safe</p>
                  <p className="text-sm text-muted-foreground">Options arrays and placeholders are always valid.</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card p-4">
                  <p className="font-semibold">Upload‑ready</p>
                  <p className="text-sm text-muted-foreground">AI can include file upload fields when needed.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-border/60 bg-card p-6 premium-shadow">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Prompt</div>
              <p className="mt-3 text-sm font-medium">“Create a 3‑step onboarding flow with identity verification and file uploads.”</p>
              <div className="mt-6 rounded-2xl bg-muted/25 border border-border/60 p-4">
                <div className="text-xs text-muted-foreground">Generated Output</div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="h-3 w-2/3 bg-muted/40 rounded" />
                  <div className="h-3 w-1/2 bg-muted/30 rounded" />
                  <div className="h-3 w-3/4 bg-muted/35 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Describe", icon: <Sparkles className="h-5 w-5" />, desc: "Write a prompt or pick a template." },
              { title: "Customize", icon: <Wand2 className="h-5 w-5" />, desc: "Fine‑tune steps, validation, and branding." },
              { title: "Launch", icon: <ArrowRight className="h-5 w-5" />, desc: "Publish instantly and collect responses." },
            ].map((step) => (
              <div key={step.title} className="rounded-2xl border border-border/60 bg-card p-6 premium-shadow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">{step.icon} {step.title}</div>
                <p className="mt-4 text-lg font-semibold">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-white/70 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-muted-foreground"> 2024 FormFlow AI. Crafted for thoughtful workflows.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/login">Sign in</Link>
            <Link href="/login">Start free</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
