"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

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
  ChevronsRight,
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

const LOGO_CONTAINER_STYLE: React.CSSProperties = {
  width: 40, height: 40, background: '#4a7c59', borderRadius: 10,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const LOGO_TEXT_STYLE: React.CSSProperties = { color: 'white', fontWeight: 700, fontSize: 18 };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    router.prefetch("/admin/dashboard");
    router.prefetch("/admin/chantiers");
    router.prefetch("/admin/clients");
    router.prefetch("/admin/crm");
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-white py-3 transition-all duration-300 ease-in-out lg:static overflow-hidden",
          "w-20",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="mb-4 border-b border-border pb-4 px-2">
          <div className="flex items-center justify-center">
            <div style={LOGO_CONTAINER_STYLE}>
              <span style={LOGO_TEXT_STYLE}>B</span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div className="space-y-2 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "relative w-full flex flex-col items-center justify-center gap-1 py-2 transition-[transform,background-color] duration-200 ease-in-out",
                  "hover:bg-[#e8e8e2] hover:-translate-y-[1px]",
                  isActive ? "border-l-2 border-[#4a7c59]" : "border-l-2 border-transparent"
                )}
              >
                <div className="grid h-10 w-10 place-content-center rounded-xl">
                  <item.icon className={cn("h-5 w-5", isActive ? "text-[#4a7c59]" : "text-muted-foreground")} />
                </div>
                <span
                  className={cn(
                    "text-[10px] leading-tight text-center px-1",
                    isActive ? "text-[#4a7c59]" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-4 space-y-2 px-0">
          {BOTTOM_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  "relative w-full flex flex-col items-center justify-center gap-1 py-2 transition-[transform,background-color] duration-200 ease-in-out hover:bg-[#e8e8e2] hover:-translate-y-[1px]",
                  isActive ? "border-l-2 border-[#4a7c59]" : "border-l-2 border-transparent"
                )}
              >
                <div className="grid h-10 w-10 place-content-center rounded-xl">
                  <item.icon className={cn("h-5 w-5", isActive ? "text-[#4a7c59]" : "text-muted-foreground")} />
                </div>
                <span
                  className={cn(
                    "text-[10px] leading-tight text-center px-1",
                    isActive ? "text-[#4a7c59]" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mt-2 border-t border-border transition-colors hover:bg-[#f0f0eb] hidden lg:block rounded-xl"
        >
          <div className="flex items-center justify-center px-3 py-3">
            <div className="grid size-9 place-content-center">
              <ChevronsRight
                className={cn(
                  "h-4 w-4 transition-transform duration-300 text-muted-foreground",
                  sidebarOpen && "rotate-180"
                )}
              />
            </div>
          </div>
        </button>
      </nav>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between bg-transparent px-6 h-16 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl text-muted-foreground hover:bg-[#f0f0eb] hover:text-foreground lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-foreground hidden sm:block">
              {NAV_ITEMS.find(
                (i) => pathname === i.href || pathname.startsWith(i.href + "/")
              )?.label ?? "Administration"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-sm text-muted-foreground">
              {new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}
            </span>
            <button
              onClick={() => router.push("/admin/parametres")}
              className="grid h-10 w-10 place-content-center rounded-xl bg-white border border-border text-muted-foreground hover:bg-[#f0f0eb] hover:text-foreground transition-colors"
              title="Paramètres"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={() => router.push("/")}
              className="grid h-10 w-10 place-content-center rounded-xl bg-white border border-border text-muted-foreground hover:bg-[#f0f0eb] hover:text-[var(--destructive)] transition-colors"
              title="Retour à l'accueil"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6">
          <div key={pathname} className="animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
