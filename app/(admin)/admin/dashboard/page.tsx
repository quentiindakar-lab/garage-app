"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/utils";
import {
  HardHat,
  DollarSign,
  FileText,
  UsersRound,
  TrendingUp,
  CalendarDays,
  Receipt,
  UserCheck,
  Users,
  ExternalLink,
} from "lucide-react";

interface DashboardStats {
  chantiersEnCours: number;
  caMois: number;
  devisEnAttente: number;
  membresActifs: number;
}

interface ActivityItem {
  type: string;
  title: string;
  description: string;
  href: string;
  createdAt: string;
}

interface ProchainChantier {
  id: string;
  nom: string;
  dateDebut: string;
  adresse: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

const TYPE_CONFIG: Record<string, { icon: typeof HardHat; color: string; bg: string }> = {
  chantier: { icon: HardHat, color: "text-[var(--primary)]", bg: "bg-[#dcf0e4]" },
  client: { icon: UserCheck, color: "text-[var(--primary)]", bg: "bg-[#dcf0e4]" },
  prospect: { icon: Users, color: "text-[var(--primary)]", bg: "bg-[#dce8f0]" },
  depense: { icon: Receipt, color: "text-[#c04040]", bg: "bg-[#f0dcdc]" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [prochains, setProchains] = useState<ProchainChantier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [chantiersRes, equipesRes, activiteRes, upcomingRes, depensesRes] = await Promise.allSettled([
        fetch("/api/chantiers?stats=true"),
        fetch("/api/equipe?stats=true"),
        fetch("/api/activite"),
        fetch("/api/chantiers?upcoming=true&limit=4"),
        fetch("/api/depenses"),
      ]);

      let chantiersEnCours = 0, devisEnAttente = 0, caMois = 0, membresActifs = 0;

      if (chantiersRes.status === "fulfilled" && chantiersRes.value.ok) {
        const data = await chantiersRes.value.json();
        chantiersEnCours = data.enCours ?? 0;
        devisEnAttente = data.devisEnAttente ?? 0;
      }
      if (depensesRes.status === "fulfilled" && depensesRes.value.ok) {
        const data = await depensesRes.value.json();
        if (Array.isArray(data)) {
          caMois = data.reduce((sum: number, d: any) => sum + (d.montant || 0), 0);
        }
      }
      if (equipesRes.status === "fulfilled" && equipesRes.value.ok) {
        const data = await equipesRes.value.json();
        membresActifs = data.actifs ?? 0;
      }
      if (activiteRes.status === "fulfilled" && activiteRes.value.ok) {
        const data = await activiteRes.value.json();
        setActivities(Array.isArray(data) ? data : []);
      }
      if (upcomingRes.status === "fulfilled" && upcomingRes.value.ok) {
        const data = await upcomingRes.value.json();
        setProchains(Array.isArray(data) ? data : []);
      }

      setStats({ chantiersEnCours, caMois, devisEnAttente, membresActifs });
    } catch {
      setStats({ chantiersEnCours: 0, caMois: 0, devisEnAttente: 0, membresActifs: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Bienvenue sur votre tableau de bord</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-border shadow-sm animate-pulse">
              <div className="h-8 w-8 rounded-xl bg-[#f5f5f0] mb-3" />
              <div className="h-3 w-20 rounded bg-[#f5f5f0] mb-2" />
              <div className="h-7 w-16 rounded bg-[#f5f5f0]" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 btp-card p-5 animate-pulse">
            <div className="h-5 w-36 rounded bg-[#f5f5f0] mb-6" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <div className="h-8 w-8 rounded-md bg-[#f5f5f0]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-[#f5f5f0]" />
                  <div className="h-2.5 w-1/2 rounded bg-[#f5f5f0]" />
                </div>
                <div className="h-2.5 w-10 rounded bg-[#f5f5f0]" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <div className="btp-card p-5 animate-pulse">
              <div className="h-5 w-40 rounded bg-[#f5f5f0] mb-4" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="space-y-2">
                    <div className="h-3 w-28 rounded bg-[#f5f5f0]" />
                    <div className="h-2.5 w-16 rounded bg-[#f5f5f0]" />
                  </div>
                  <div className="h-3 w-3 rounded bg-[#f5f5f0]" />
                </div>
              ))}
            </div>
            <div className="btp-card p-5 animate-pulse">
              <div className="h-5 w-28 rounded bg-[#f5f5f0] mb-4" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 rounded-xl bg-[#f5f5f0] mb-2" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Bienvenue sur votre tableau de bord</p>
        </div>
        <button
          onClick={fetchAll}
          className="btp-btn-secondary px-4 py-2 text-sm"
        >
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={HardHat}
          label="Chantiers en cours"
          value={String(stats?.chantiersEnCours ?? 0)}
          iconBg="bg-[#f0f0eb]"
          iconColor="text-[var(--primary)]"
          onClick={() => router.push("/admin/chantiers")}
        />
        <StatCard
          icon={DollarSign}
          label="Dépenses du mois"
          value={formatMoney(stats?.caMois ?? 0)}
          iconBg="bg-white/15"
          iconColor="text-white"
          accent
          onClick={() => router.push("/admin/bilan")}
        />
        <StatCard
          icon={FileText}
          label="Devis en attente"
          value={String(stats?.devisEnAttente ?? 0)}
          iconBg="bg-[#f0f0eb]"
          iconColor="text-[var(--primary)]"
          onClick={() => router.push("/admin/crm")}
        />
        <StatCard
          icon={UsersRound}
          label="Membres actifs"
          value={String(stats?.membresActifs ?? 0)}
          iconBg="bg-[#f0f0eb]"
          iconColor="text-[var(--primary)]"
          onClick={() => router.push("/admin/equipe")}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity */}
        <div className="lg:col-span-2">
          <div className="btp-card p-5">
            <h3 className="text-lg font-semibold text-foreground mb-6">Activité récente</h3>
            {activities.length > 0 ? (
              <div className="space-y-2">
                {activities.map((act, i) => {
                  const cfg = TYPE_CONFIG[act.type] || TYPE_CONFIG.chantier;
                  const Icon = cfg.icon;
                  return (
                    <div key={i}
                      onClick={() => router.push(act.href)}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#fafaf8] transition-colors cursor-pointer">
                      <div className={`p-2 rounded-md ${cfg.bg}`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{act.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{act.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground/80 whitespace-nowrap">{timeAgo(act.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune activité récente</p>
            )}
          </div>
        </div>

        {/* Side */}
        <div className="space-y-6">
          <div className="btp-card p-5">
            <h3 className="text-lg font-semibold text-foreground mb-4">Prochains chantiers</h3>
            {prochains.length > 0 ? (
              <div className="space-y-3">
                {prochains.map((c) => (
                  <div key={c.id}
                    onClick={() => router.push(`/admin/chantiers/${c.id}`)}
                    className="flex items-center justify-between py-2 border-b border-[#f0f0eb] last:border-0 cursor-pointer hover:bg-[#fafaf8] rounded-xl px-2 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.nom}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(c.dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun chantier à venir</p>
            )}
          </div>

          <div className="btp-card p-5">
            <h3 className="text-lg font-semibold text-foreground mb-4">Accès rapide</h3>
            <div className="space-y-2">
              {[
                { label: "Nouveau chantier", href: "/admin/chantiers/nouveau", icon: HardHat, color: "text-amber-400" },
                { label: "Nouveau client", href: "/admin/clients", icon: UserCheck, color: "text-emerald-400" },
                { label: "Estimation IA", href: "/admin/estimation", icon: TrendingUp, color: "text-purple-400" },
              ].map((item) => (
                <button key={item.href} onClick={() => router.push(item.href)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#f5f5f0] hover:bg-[#f0f0eb] text-sm text-foreground transition-colors text-left border border-border"
                >
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  onClick,
  accent = false,
}: {
  icon: typeof HardHat;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={accent
        ? "p-5 rounded-2xl bg-[#4a7c59] border border-[#4a7c59] shadow-sm hover:shadow-lg hover:-translate-y-[3px] hover:scale-[1.01] transition-[transform,box-shadow] duration-200 ease-in-out cursor-pointer"
        : "p-5 rounded-2xl bg-white border border-border shadow-sm hover:shadow-lg hover:-translate-y-[3px] hover:scale-[1.01] transition-[transform,box-shadow] duration-200 ease-in-out cursor-pointer"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`inline-flex p-2.5 rounded-xl ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="mt-3">
            <div
              className={accent ? "text-[12px] text-white/80" : "text-[12px] text-[#888880]"}
            >
              {label}
            </div>
            <div
              className={accent ? "mt-1 text-[24px] font-bold text-white" : "mt-1 text-[24px] font-bold text-[#1a1a1a]"}
            >
              {value}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
