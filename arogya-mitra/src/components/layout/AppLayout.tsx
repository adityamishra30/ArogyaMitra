import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Dumbbell, 
  Utensils, 
  TrendingUp, 
  BotMessageSquare, 
  LogOut,
  Menu,
  X,
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/nutrition", label: "Nutrition", icon: Utensils },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/coach", label: "AROMI Coach", icon: BotMessageSquare },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-card border-r border-border/50 shadow-2xl shadow-primary/5 z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-white font-display font-bold text-xl">A</span>
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-foreground">
            Arogya<span className="text-primary">Mitra</span>
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl font-medium transition-all duration-300 group",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary/10 hover:text-secondary"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-secondary"
                )} />
                {item.label}
                {isActive && (
                  <motion.div 
                    layoutId="active-pill" 
                    className="absolute left-0 w-1.5 h-8 bg-primary rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="bg-muted/50 p-4 rounded-2xl flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-md">
              <span className="text-white font-display font-bold">A</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight">ArogyaMitra</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-muted rounded-xl text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto w-full h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-3/4 max-w-sm bg-card border-l border-border/50 shadow-2xl z-50 flex flex-col md:hidden"
            >
              <div className="p-4 flex justify-end">
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 bg-muted rounded-xl text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-2 space-y-2">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-4 rounded-2xl font-medium transition-all",
                      location === item.href 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="p-6">
                <button 
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-destructive bg-destructive/10 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
