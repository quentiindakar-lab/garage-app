"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  Users,
  MapPin,
  HardHat,
  ExternalLink,
  UserCheck,
} from "lucide-react";

interface PlanningChantier {
  id: string;
  nom: string;
  adresse: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
  couleur: string;
  chef?: string;
  membres?: string[];
  clientNom?: string;
  clientId?: string;
}

type Vue = "mois" | "semaine";

const STATUT_COLORS: Record<string, string> = {
  EN_COURS: "#F59E0B",
  TERMINE: "#10B981",
  PROSPECT: "#8B5CF6",
  DEVIS_ENVOYE: "#3B82F6",
  ANNULE: "#EF4444",
};

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const DEMO_CHANTIERS: PlanningChantier[] = [
  { id: "1", nom: "Rénovation cuisine", adresse: "12 rue Victor Hugo", statut: "EN_COURS", dateDebut: "2026-03-10", dateFin: "2026-03-24", couleur: "#F59E0B", chef: "Marc Dupont", membres: ["Luc Bernard", "Paul Simon"] },
  { id: "2", nom: "Salle de bain", adresse: "5 av. des Platanes", statut: "EN_COURS", dateDebut: "2026-03-12", dateFin: "2026-03-20", couleur: "#3B82F6", chef: "Luc Bernard" },
  { id: "3", nom: "Extension véranda", adresse: "8 chemin du Lac", statut: "PROSPECT", dateDebut: "2026-03-22", dateFin: "2026-04-15", couleur: "#8B5CF6" },
  { id: "4", nom: "Peinture T3", adresse: "34 bd Alsace", statut: "EN_COURS", dateDebut: "2026-03-25", dateFin: "2026-03-28", couleur: "#10B981", chef: "Thomas Petit" },
  { id: "5", nom: "Électricité villa", adresse: "Route de Gan", statut: "DEVIS_ENVOYE", dateDebut: "2026-04-02", dateFin: "2026-04-12", couleur: "#EF4444" },
];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

export default function PlanningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterChantierId = searchParams.get("chantier");
  const [vue, setVue] = useState<Vue>("mois");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [chantiers, setChantiers] = useState<PlanningChantier[]>(DEMO_CHANTIERS);
  const [selected, setSelected] = useState<PlanningChantier | null>(null);
  const [filterMembre, setFilterMembre] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/chantiers");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setChantiers(data.map((c: any) => ({
              id: c.id, nom: c.nom, adresse: c.adresse || "", statut: c.statut,
              dateDebut: c.dateDebut, dateFin: c.dateFin || c.dateDebut,
              couleur: STATUT_COLORS[c.statut] || "#F59E0B",
              chef: c.chef ? `${c.chef.prenom || ""} ${c.chef.nom}`.trim() : c.affectations?.[0]?.membre?.nom,
              membres: c.affectations?.map((a: any) => `${a.membre.prenom || ""} ${a.membre.nom}`.trim()) || [],
              clientNom: c.client ? `${c.client.nom} ${c.client.prenom || ""}`.trim() : undefined,
              clientId: c.client?.id,
            })));
          }
        }
      } catch {}
    })();
  }, []);

  const navigate = (dir: number) => {
    setCurrentDate((d) => {
      const n = new Date(d);
      if (vue === "mois") n.setMonth(n.getMonth() + dir);
      else n.setDate(n.getDate() + dir * 7);
      return n;
    });
  };

  const filteredChantiers = chantiers.filter((c) => {
    if (filterChantierId && c.id !== filterChantierId) return false;
    if (filterMembre && c.chef !== filterMembre && !c.membres?.includes(filterMembre)) return false;
    return true;
  });

  const allMembres = useMemo(() => {
    const set = new Set<string>();
    chantiers.forEach((c) => { if (c.chef) set.add(c.chef); c.membres?.forEach((m) => set.add(m)); });
    return Array.from(set);
  }, [chantiers]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white">Planning</h1>
          <p className="text-slate-400 mt-1">
            {filterChantierId
              ? <span>Filtré par chantier — <button onClick={() => router.push("/admin/planning")} className="text-amber-400 hover:underline">Voir tout</button></span>
              : "Vue d'ensemble des chantiers"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allMembres.length > 0 && (
            <select value={filterMembre || ""} onChange={(e) => setFilterMembre(e.target.value || null)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:outline-none">
              <option value="">Tous les membres</option>
              {allMembres.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            <button onClick={() => setVue("mois")} className={`px-3 py-2 text-sm font-medium transition-colors ${vue === "mois" ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-slate-400"}`}>Mois</button>
            <button onClick={() => setVue("semaine")} className={`px-3 py-2 text-sm font-medium transition-colors ${vue === "semaine" ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-slate-400"}`}>Semaine</button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold text-white">
          {vue === "mois"
            ? `${MONTHS_FR[currentDate.getMonth()]} ${currentDate.getFullYear()}`
            : `Semaine du ${getMonday(currentDate).toLocaleDateString("fr-FR")}`
          }
        </h2>
        <button onClick={() => navigate(1)} className="p-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {vue === "mois" ? (
        <MonthView currentDate={currentDate} chantiers={filteredChantiers} onSelect={setSelected} />
      ) : (
        <WeekView currentDate={currentDate} chantiers={filteredChantiers} onSelect={setSelected} />
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md mx-4 rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{selected.nom}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-400"><MapPin className="h-4 w-4 text-slate-600" /> {selected.adresse}</div>
              <div className="flex items-center gap-2 text-slate-400"><CalendarDays className="h-4 w-4 text-slate-600" /> {new Date(selected.dateDebut).toLocaleDateString("fr-FR")} → {new Date(selected.dateFin).toLocaleDateString("fr-FR")}</div>
              {selected.clientNom && (
                <div className="flex items-center gap-2 text-slate-400">
                  <UserCheck className="h-4 w-4 text-slate-600" /> Client :
                  {selected.clientId ? (
                    <button onClick={() => { setSelected(null); router.push(`/admin/clients/${selected.clientId}`); }}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1">
                      {selected.clientNom} <ExternalLink className="h-3 w-3" />
                    </button>
                  ) : (
                    <span>{selected.clientNom}</span>
                  )}
                </div>
              )}
              {selected.chef && <div className="flex items-center gap-2 text-slate-400"><HardHat className="h-4 w-4 text-slate-600" /> Chef : {selected.chef}</div>}
              {selected.membres && selected.membres.length > 0 && (
                <div className="flex items-center gap-2 text-slate-400"><Users className="h-4 w-4 text-slate-600" /> {selected.membres.join(", ")}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selected.couleur }} />
              <span className="text-sm text-slate-300">{selected.statut.replace(/_/g, " ")}</span>
            </div>
            <button onClick={() => { setSelected(null); router.push(`/admin/chantiers/${selected.id}`); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold transition-colors">
              <ExternalLink className="h-4 w-4" /> Voir la fiche complète
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthView({ currentDate, chantiers, onSelect }: { currentDate: Date; chantiers: PlanningChantier[]; onSelect: (c: PlanningChantier) => void }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const today = new Date();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dayChantiers = (day: number) => {
    const date = new Date(year, month, day);
    return chantiers.filter((c) => {
      const s = new Date(c.dateDebut); s.setHours(0, 0, 0, 0);
      const e = new Date(c.dateFin); e.setHours(23, 59, 59);
      return date >= s && date <= e;
    });
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex-1">
      <div className="grid grid-cols-7 border-b border-slate-800">
        {DAYS_FR.map((d) => (
          <div key={d} className="p-2 text-center text-xs font-semibold text-slate-500 uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="min-h-[80px] border-b border-r border-slate-800/50 bg-slate-950/30" />;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const dc = dayChantiers(day);
          return (
            <div key={i} className="min-h-[80px] border-b border-r border-slate-800/50 p-1 hover:bg-slate-800/20 transition-colors">
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${isToday ? "bg-amber-500 text-slate-900" : "text-slate-400"}`}>
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dc.slice(0, 2).map((c) => (
                  <button key={c.id} onClick={() => onSelect(c)}
                    className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: c.couleur + "40", borderLeft: `2px solid ${c.couleur}` }}>
                    {c.nom}
                  </button>
                ))}
                {dc.length > 2 && (
                  <span className="text-[10px] text-slate-500 px-1">+{dc.length - 2} autre{dc.length - 2 > 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ currentDate, chantiers, onSelect }: { currentDate: Date; chantiers: PlanningChantier[]; onSelect: (c: PlanningChantier) => void }) {
  const monday = getMonday(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
  const today = new Date();

  const dayChantiers = (date: Date) => {
    return chantiers.filter((c) => {
      const s = new Date(c.dateDebut); s.setHours(0, 0, 0, 0);
      const e = new Date(c.dateFin); e.setHours(23, 59, 59);
      return date >= s && date <= e;
    });
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex-1">
      <div className="grid grid-cols-7 divide-x divide-slate-800">
        {days.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          const dc = dayChantiers(d);
          return (
            <div key={i} className="min-h-[300px]">
              <div className={`p-3 text-center border-b border-slate-800 ${isToday ? "bg-amber-500/10" : ""}`}>
                <div className="text-xs text-slate-500 uppercase">{DAYS_FR[i]}</div>
                <div className={`text-lg font-bold ${isToday ? "text-amber-400" : "text-white"}`}>{d.getDate()}</div>
              </div>
              <div className="p-2 space-y-1.5">
                {dc.map((c) => (
                  <button key={c.id} onClick={() => onSelect(c)}
                    className="w-full text-left rounded-lg p-2 hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: c.couleur + "20", borderLeft: `3px solid ${c.couleur}` }}>
                    <p className="text-xs font-medium text-white truncate">{c.nom}</p>
                    {c.chef && <p className="text-[10px] text-slate-500 mt-0.5">{c.chef}</p>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
