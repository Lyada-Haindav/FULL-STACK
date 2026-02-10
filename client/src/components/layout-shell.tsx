import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getUserDisplayName } from "@/lib/auth-utils";
import { 
  LayoutDashboard, 
  LogOut, 
  PlusCircle, 
  LayoutTemplate,
  Settings, 
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-sm fixed h-full z-30">
        <div className="p-6 border-b border-border/50">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight">FormFlow AI</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${isActive('/dashboard') ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <LayoutDashboard size={20} />
              Dashboard
            </div>
          </Link>
          <Link href="/templates">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${isActive('/templates') ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <LayoutTemplate size={20} />
              Templates
            </div>
          </Link>
          <Link href="/dashboard/new">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${isActive('/dashboard/new') ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <PlusCircle size={20} />
              Create Form
            </div>
          </Link>
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback>{getUserDisplayName(user).charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{getUserDisplayName(user)}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { logout(); setLocation("/"); }}>
            <LogOut size={16} />
            Log Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0 flex-1">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="font-display font-bold text-lg truncate">{getUserDisplayName(user)}</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex-shrink-0">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 top-16 bg-background z-30 p-4"
          >
            <nav className="space-y-4">
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted">
                  <LayoutDashboard size={20} />
                  Dashboard
                </div>
              </Link>
              <Link href="/templates" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted">
                  <LayoutTemplate size={20} />
                  Templates
                </div>
              </Link>
              <Link href="/dashboard/new" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted">
                  <PlusCircle size={20} />
                  Create Form
                </div>
              </Link>
              <Button variant="destructive" className="w-full justify-start gap-2" onClick={() => { logout(); setLocation("/"); }}>
                <LogOut size={16} />
                Log Out
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto animate-in-fade">
          {children}
        </div>
      </main>
    </div>
  );
}
