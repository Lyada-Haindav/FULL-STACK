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
        <div className="min-h-16 border-b border-white/20 bg-gradient-to-r from-[#203f9f] via-[#2757ca] to-[#2f67eb]">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 md:px-6">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2 text-white sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-base font-bold">
                F
              </div>
              <span className="truncate font-display text-lg font-semibold tracking-tight sm:text-2xl">My Forms</span>
            </Link>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Avatar className="h-9 w-9 border border-white/40 bg-white/85 text-[#1d2b4f] sm:h-10 sm:w-10">
                <AvatarFallback className="bg-transparent font-semibold">
                  {getUserDisplayName(user).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="secondary"
                className="border border-white/35 bg-white/15 px-2 text-white hover:bg-white/25 sm:px-3"
                onClick={async () => {
                  await logout();
                  setLocation("/login");
                }}
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="border-b border-[#c9d5ea] bg-[#dbe4f5]/95">
          <div className="mx-auto max-w-7xl overflow-x-auto px-3 py-3 md:px-6">
            <nav className="flex min-w-max items-center gap-1 rounded-full border border-[#cfd9ec] bg-white/90 p-1.5 shadow-sm sm:mx-auto sm:w-fit sm:gap-2">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <div key={item.href} className="flex items-center">
                    <Link href={item.href}>
                      <button
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:gap-2 sm:px-4 sm:text-sm ${
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

      <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
