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
  EN_COURS: { bg: "bg-[#dcf0e4]", text: "text-[var(--primary)]", dot: "bg-[var(--primary)]" },
  DEVIS_ENVOYE: { bg: "bg-[#dce8f0]", text: "text-[var(--primary)]", dot: "bg-[var(--primary)]" },
  PROSPECT: { bg: "bg-[#f0eadc]", text: "text-[#886a30]", dot: "bg-[#886a30]" },
  TERMINE: { bg: "bg-[#e8e8e2]", text: "text-[#666660]", dot: "bg-[#666660]" },
  ANNULE: { bg: "bg-[#f0dcdc]", text: "text-[#c04040]", dot: "bg-[#c04040]" },
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
      if (res.ok) {
        const data = await res.json();
        setChantiers(Array.isArray(data) ? data : []);
      }
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

  const filtered = Array.isArray(chantiers)
    ? chantiers.filter((c) => {
        const matchSearch =
          !search ||
          c.nom.toLowerCase().includes(search.toLowerCase()) ||
          c.adresse.toLowerCase().includes(search.toLowerCase());
        const matchStatut = !filterStatut || c.statut === filterStatut;
        return matchSearch && matchStatut;
      })
    : [];

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
          <h1 className="text-2xl font-semibold text-foreground">Chantiers</h1>
          <p className="text-muted-foreground mt-1">{chantiers.length} chantier{chantiers.length > 1 ? "s" : ""} au total</p>
        </div>
        <button
          onClick={() => router.push("/admin/chantiers/nouveau")}
          className="btp-btn-primary flex items-center gap-2 px-4 py-2.5 font-semibold text-sm"
        >
          <Plus className="h-4 w-4" />
          Nouveau chantier
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un chantier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="btp-input pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setFilterStatut(null)}
            className={`px-3 py-2 rounded-[10px] text-xs font-medium transition-colors border border-border ${!filterStatut ? "bg-[var(--primary)] text-white" : "bg-[#f0f0eb] text-foreground hover:brightness-95"}`}
          >
            Tous
          </button>
          {Object.entries(STATUT_LABEL).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterStatut(key)}
              className={`px-3 py-2 rounded-[10px] text-xs font-medium transition-colors border border-border ${filterStatut === key ? "bg-[var(--primary)] text-white" : "bg-[#f0f0eb] text-foreground hover:brightness-95"}`}
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
              className="btp-card p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">
                  {c.nom}
                </h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs font-medium ${style.bg} ${style.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {STATUT_LABEL[c.statut]}
                </span>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{c.adresse}</span>
                </div>
                {c.surface && (
                  <div className="flex items-center gap-2">
                    <HardHat className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{c.surface} m²</span>
                  </div>
                )}
                {c.dateDebut && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {new Date(c.dateDebut).toLocaleDateString("fr-FR")}
                      {c.dateFin && ` → ${new Date(c.dateFin).toLocaleDateString("fr-FR")}`}
                    </span>
                  </div>
                )}
                {chef && (
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
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
          <HardHat className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun chantier trouvé</p>
        </div>
      )}
    </div>
  );
}
