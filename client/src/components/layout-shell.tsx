import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getUserDisplayName } from "@/lib/auth-utils";
import { LayoutDashboard, LayoutTemplate, PlusCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/dashboard/new", label: "Create Form", icon: PlusCircle },
];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/dashboard" || location.startsWith("/builder/");
    }
    return location === href;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40">
        <div className="h-16 border-b border-white/20 bg-gradient-to-r from-[#203f9f] via-[#2757ca] to-[#2f67eb]">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 md:px-6">
            <Link href="/dashboard" className="flex items-center gap-3 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-base font-bold">
                F
              </div>
              <span className="font-display text-2xl font-semibold tracking-tight">My Forms</span>
            </Link>

            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-white/40 bg-white/85 text-[#1d2b4f]">
                <AvatarFallback className="bg-transparent font-semibold">
                  {getUserDisplayName(user).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="secondary"
                className="border border-white/35 bg-white/15 text-white hover:bg-white/25"
                onClick={() => {
                  logout();
                  setLocation("/");
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </div>
        </div>

        <div className="border-b border-[#c9d5ea] bg-[#dbe4f5]/95">
          <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
            <nav className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#cfd9ec] bg-white/90 p-1.5 shadow-sm">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <div key={item.href} className="flex items-center">
                    <Link href={item.href}>
                      <button
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                          active
                            ? "bg-[#eef3ff] text-[#ef8a00]"
                            : "text-[#6a7897] hover:bg-[#f4f7ff] hover:text-[#1f2c4a]"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    </Link>
                    {idx < navItems.length - 1 ? <span className="mx-1 h-5 w-px bg-[#d3ddf0]" /> : null}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
