"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MapPin,
  CalendarDays,
  HardHat,
  Loader2,
  User,
} from "lucide-react";

interface Chantier {
  id: string;
  nom: string;
  adresse: string;
  statut: string;
  surface?: number | null;
  dateDebut?: string | null;
  dateFin?: string | null;
  description?: string | null;
  affectations?: { membre: { nom: string; prenom?: string | null; role: string } }[];
}

const STATUT_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  EN_COURS: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  TERMINE: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
  PROSPECT: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
  DEVIS_ENVOYE: { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-500" },
  ANNULE: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
};

const STATUT_LABEL: Record<string, string> = {
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  PROSPECT: "En attente",
  DEVIS_ENVOYE: "Devis envoyé",
  ANNULE: "Annulé",
};

export default function ChantiersPage() {
  const router = useRouter();
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string | null>(null);

  const fetchChantiers = useCallback(async () => {
    try {
      const res = await fetch("/api/chantiers");
      if (res.ok) setChantiers(await res.json());
    } catch {
      setChantiers([
        { id: "1", nom: "Rénovation cuisine", adresse: "12 rue Victor Hugo, Pau", statut: "EN_COURS", surface: 25, dateDebut: "2026-03-10", dateFin: "2026-03-24", affectations: [{ membre: { nom: "Dupont", prenom: "Marc", role: "CHEF_CHANTIER" } }] },
        { id: "2", nom: "Salle de bain complète", adresse: "5 av. des Platanes, Pau", statut: "EN_COURS", surface: 12, dateDebut: "2026-03-12", dateFin: "2026-03-20", affectations: [{ membre: { nom: "Bernard", prenom: "Luc", role: "OUVRIER" } }] },
        { id: "3", nom: "Extension véranda", adresse: "8 chemin du Lac, Jurançon", statut: "PROSPECT", surface: 30, dateDebut: "2026-03-22", dateFin: "2026-04-15", affectations: [] },
        { id: "4", nom: "Peinture T3", adresse: "34 bd Alsace, Pau", statut: "DEVIS_ENVOYE", surface: 65, dateDebut: "2026-03-25", dateFin: "2026-03-28", affectations: [] },
        { id: "5", nom: "Plomberie immeuble", adresse: "1 place Royale, Pau", statut: "TERMINE", surface: 200, dateDebut: "2026-03-01", dateFin: "2026-03-08", affectations: [{ membre: { nom: "Petit", prenom: "Thomas", role: "OUVRIER" } }] },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChantiers(); }, [fetchChantiers]);

  const filtered = chantiers.filter((c) => {
    const matchSearch = !search || c.nom.toLowerCase().includes(search.toLowerCase()) || c.adresse.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || c.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Chantiers</h1>
          <p className="text-slate-400 mt-1">{chantiers.length} chantier{chantiers.length > 1 ? "s" : ""} au total</p>
        </div>
        <button
          onClick={() => router.push("/admin/chantiers/nouveau")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau chantier
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher un chantier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setFilterStatut(null)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${!filterStatut ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-400 hover:text-white"}`}
          >
            Tous
          </button>
          {Object.entries(STATUT_LABEL).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterStatut(key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filterStatut === key ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-400 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const style = STATUT_STYLE[c.statut] || STATUT_STYLE.PROSPECT;
          const chef = c.affectations?.find((a) => a.membre.role === "CHEF_CHANTIER")?.membre;
          return (
            <div
              key={c.id}
              onClick={() => router.push(`/admin/chantiers/${c.id}`)}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700 hover:bg-slate-900/80 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors">
                  {c.nom}
                </h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {STATUT_LABEL[c.statut]}
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-600" />
                  <span className="truncate">{c.adresse}</span>
                </div>
                {c.surface && (
                  <div className="flex items-center gap-2">
                    <HardHat className="h-3.5 w-3.5 text-slate-600" />
                    <span>{c.surface} m²</span>
                  </div>
                )}
                {c.dateDebut && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-600" />
                    <span>
                      {new Date(c.dateDebut).toLocaleDateString("fr-FR")}
                      {c.dateFin && ` → ${new Date(c.dateFin).toLocaleDateString("fr-FR")}`}
                    </span>
                  </div>
                )}
                {chef && (
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-600" />
                    <span>{chef.prenom} {chef.nom}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <HardHat className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">Aucun chantier trouvé</p>
        </div>
      )}
    </div>
  );
}
