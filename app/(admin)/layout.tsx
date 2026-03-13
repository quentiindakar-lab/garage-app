"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { BTP_CONFIG } from "@/config/btp.config";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  HardHat,
  Sparkles,
  Users,
  Calendar,
  BarChart3,
  UsersRound,
  Settings,
  ChevronDown,
  ChevronsRight,
  Moon,
  Sun,
  Bell,
  LogOut,
  Menu,
  UserCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Chantiers", href: "/admin/chantiers", icon: HardHat },
  { label: "Clients", href: "/admin/clients", icon: UserCheck },
  { label: "Estimation IA", href: "/admin/estimation", icon: Sparkles },
  { label: "CRM / Pipeline", href: "/admin/crm", icon: Users },
  { label: "Planning", href: "/admin/planning", icon: Calendar },
  { label: "Bilan financier", href: "/admin/bilan", icon: BarChart3 },
  { label: "Équipe", href: "/admin/equipe", icon: UsersRound },
];

const BOTTOM_NAV = [
  { label: "Paramètres", href: "/admin/parametres", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-amber-500" />
          <p className="text-sm text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const user = session?.user as { name?: string | null; role?: string } | undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-slate-900 p-2 shadow-xl transition-all duration-300 ease-in-out lg:static",
          sidebarOpen ? "w-64" : "w-[68px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
                <HardHat className="h-5 w-5 text-white" />
              </div>
              {sidebarOpen && (
                <div>
                  <span className="block text-sm font-bold text-white">{BTP_CONFIG.nom}</span>
                  <span className="block text-xs text-slate-400">Gestion BTP</span>
                </div>
              )}
            </div>
            {sidebarOpen && <ChevronDown className="h-4 w-4 text-slate-500" />}
          </div>
        </div>

        {/* Nav items */}
        <div className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setMobileOpen(false);
                }}
                className={cn(
                  "relative flex h-11 w-full items-center rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-amber-500/10 text-amber-400 shadow-sm border-l-2 border-amber-500"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
                )}
              >
                <div className="grid h-full w-12 place-content-center">
                  <item.icon className={cn("h-[18px] w-[18px]", isActive && "text-amber-400")} />
                </div>
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom */}
        {sidebarOpen && (
          <div className="border-t border-slate-800 pt-4 space-y-1">
            <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Compte
            </div>
            {BOTTOM_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "relative flex h-11 w-full items-center rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border-l-2 border-amber-500"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
                  )}
                >
                  <div className="grid h-full w-12 place-content-center">
                    <item.icon className="h-[18px] w-[18px]" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mt-2 border-t border-slate-800 transition-colors hover:bg-slate-800/70 hidden lg:block"
        >
          <div className="flex items-center p-3">
            <div className="grid size-10 place-content-center">
              <ChevronsRight
                className={cn(
                  "h-4 w-4 transition-transform duration-300 text-slate-500",
                  sidebarOpen && "rotate-180"
                )}
              />
            </div>
            {sidebarOpen && (
              <span className="text-sm font-medium text-slate-500">Réduire</span>
            )}
          </div>
        </button>
      </nav>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm px-4 lg:px-6 h-16 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-white hidden sm:block">
              {NAV_ITEMS.find(
                (i) => pathname === i.href || pathname.startsWith(i.href + "/")
              )?.label ?? "Administration"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {user?.name && (
              <span className="hidden sm:inline text-sm font-medium text-slate-300">
                {user.name}
              </span>
            )}
            <button className="relative p-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full" />
            </button>
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-red-400 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
