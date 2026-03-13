"use client";

import { useEffect, useState, useCallback } from "react";
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

const TYPE_CONFIG: Record<string, { icon: typeof HardHat; color: string; bg: string }> = {
  chantier: { icon: HardHat, color: "text-amber-400", bg: "bg-amber-500/10" },
  client: { icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  prospect: { icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
  depense: { icon: Receipt, color: "text-red-400", bg: "bg-red-500/10" },
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
      const [chantiersRes, equipesRes, activiteRes, chantiersListRes] = await Promise.allSettled([
        fetch("/api/chantiers?stats=true"),
        fetch("/api/equipe?stats=true"),
        fetch("/api/activite"),
        fetch("/api/chantiers"),
      ]);

      let chantiersEnCours = 0, devisEnAttente = 0, caMois = 0, membresActifs = 0;

      if (chantiersRes.status === "fulfilled" && chantiersRes.value.ok) {
        const data = await chantiersRes.value.json();
        chantiersEnCours = data.enCours ?? 0;
        devisEnAttente = data.devisEnAttente ?? 0;
        caMois = data.caMois ?? 0;
      }
      if (equipesRes.status === "fulfilled" && equipesRes.value.ok) {
        const data = await equipesRes.value.json();
        membresActifs = data.actifs ?? 0;
      }
      if (activiteRes.status === "fulfilled" && activiteRes.value.ok) {
        const data = await activiteRes.value.json();
        setActivities(Array.isArray(data) ? data : []);
      }
      if (chantiersListRes.status === "fulfilled" && chantiersListRes.value.ok) {
        const data = await chantiersListRes.value.json();
        if (Array.isArray(data)) {
          const now = new Date();
          const upcoming = data
            .filter((c: any) => c.dateDebut && new Date(c.dateDebut) >= now && c.statut !== "ANNULE" && c.statut !== "TERMINE")
            .sort((a: any, b: any) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
            .slice(0, 4)
            .map((c: any) => ({ id: c.id, nom: c.nom, dateDebut: c.dateDebut, adresse: c.adresse }));
          setProchains(upcoming);
        }
      }

      setStats({ chantiersEnCours, caMois, devisEnAttente, membresActifs });
    } catch {
      setStats({ chantiersEnCours: 0, caMois: 0, devisEnAttente: 0, membresActifs: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Bienvenue sur votre tableau de bord</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl border border-slate-800 bg-slate-900 animate-pulse">
              <div className="h-20 rounded bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Bienvenue sur votre tableau de bord</p>
        </div>
        <button
          onClick={fetchAll}
          className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
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
          iconBg="bg-amber-500/10"
          iconColor="text-amber-400"
          onClick={() => router.push("/admin/chantiers")}
        />
        <StatCard
          icon={DollarSign}
          label="Dépenses du mois"
          value={formatMoney(stats?.caMois ?? 0)}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-400"
          onClick={() => router.push("/admin/bilan")}
        />
        <StatCard
          icon={FileText}
          label="Devis en attente"
          value={String(stats?.devisEnAttente ?? 0)}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-400"
          onClick={() => router.push("/admin/crm")}
        />
        <StatCard
          icon={UsersRound}
          label="Membres actifs"
          value={String(stats?.membresActifs ?? 0)}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-400"
          onClick={() => router.push("/admin/equipe")}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Activité récente</h3>
            {activities.length > 0 ? (
              <div className="space-y-2">
                {activities.map((act, i) => {
                  const cfg = TYPE_CONFIG[act.type] || TYPE_CONFIG.chantier;
                  const Icon = cfg.icon;
                  return (
                    <div key={i}
                      onClick={() => router.push(act.href)}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer">
                      <div className={`p-2 rounded-lg ${cfg.bg}`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{act.title}</p>
                        <p className="text-xs text-slate-500 truncate">{act.description}</p>
                      </div>
                      <span className="text-xs text-slate-600 whitespace-nowrap">{timeAgo(act.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">Aucune activité récente</p>
            )}
          </div>
        </div>

        {/* Side */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Prochains chantiers</h3>
            {prochains.length > 0 ? (
              <div className="space-y-3">
                {prochains.map((c) => (
                  <div key={c.id}
                    onClick={() => router.push(`/admin/chantiers/${c.id}`)}
                    className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0 cursor-pointer hover:bg-slate-800/30 rounded-lg px-2 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{c.nom}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(c.dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Aucun chantier à venir</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Accès rapide</h3>
            <div className="space-y-2">
              {[
                { label: "Nouveau chantier", href: "/admin/chantiers/nouveau", icon: HardHat, color: "text-amber-400" },
                { label: "Nouveau client", href: "/admin/clients", icon: UserCheck, color: "text-emerald-400" },
                { label: "Estimation IA", href: "/admin/estimation", icon: TrendingUp, color: "text-purple-400" },
              ].map((item) => (
                <button key={item.href} onClick={() => router.push(item.href)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-sm text-slate-300 hover:text-white transition-colors text-left">
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

function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  onClick,
}: {
  icon: typeof HardHat;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="p-6 rounded-xl border border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-900/80 transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <TrendingUp className="h-4 w-4 text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="text-sm font-medium text-slate-400 mb-1">{label}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
