"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/utils";
import {
  Plus,
  Camera,
  Loader2,
  Search,
  Download,
  X,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import dynamic from "next/dynamic";

const BilanPieChart = dynamic(
  () =>
    import("recharts").then((mod) => {
      const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } = mod;
      return function BilanPieChartInner(props: any) {
        const total = (props.data as any[]).reduce((s: number, d: any) => s + d.value, 0);
        const renderLegend = (legendProps: any) => {
          const { payload } = legendProps;
          return (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 16px", paddingTop: 4 }}>
              {(payload ?? []).map((entry: any, i: number) => {
                const pct = total > 0 ? ((entry.payload.value / total) * 100).toFixed(0) : "0";
                return (
                  <span key={`lg-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: entry.color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ color: "#1a1a1a" }}>{entry.value}</span>
                    <span style={{ color: "#888880" }}>{pct}%</span>
                  </span>
                );
              })}
            </div>
          );
        };
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={props.data} cx="50%" cy="42%" innerRadius={36} outerRadius={62} paddingAngle={3} dataKey="value">
                {props.data.map((d: any, i: number) => <Cell key={`cell-${i}`} fill={props.colors[d.name] || "#6b7280"} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [props.formatMoneyFn(Number(v)), ""]} contentStyle={{ borderRadius: 12, background: "#ffffff", border: "1px solid #e8e8e2", color: "#1a1a1a" }} />
              <Legend content={renderLegend} verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        );
      };
    }),
  { ssr: false }
);

const BilanBarChart = dynamic(
  () =>
    import("recharts").then((mod) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } = mod;
      return function BilanBarChartInner(props: any) {
        const colorValues = Object.values(props.colors) as string[];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={props.data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e2" />
              <XAxis type="number" stroke="#888880" tick={{ fontSize: 12 }} tickFormatter={(v: any) => `${v}€`} />
              <YAxis type="category" dataKey="name" stroke="#888880" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(v: any) => [props.formatMoneyFn(Number(v)), "Dépenses"]} contentStyle={{ borderRadius: 12, background: "#ffffff", border: "1px solid #e8e8e2", color: "#1a1a1a" }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {props.data.map((d: any, i: number) => (
                  <Cell key={d.name} fill={props.colors[d.name] || colorValues[i % colorValues.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      };
    }),
  { ssr: false }
);

interface Depense {
  id: string;
  montant: number;
  date: string;
  fournisseur: string;
  categorie: string;
  notes?: string;
  chantierId?: string | null;
  chantierNom?: string;
  photoUrl?: string;
}

const CATEGORIES = ["Repas", "Carburant", "Matériaux", "Outillage", "Transport", "Autre"];
const CATEGORIE_COLORS: Record<string, string> = {
  "Matériaux": "#4a7c59",
  MATERIAUX: "#4a7c59",
  Carburant: "#f59e0b",
  CARBURANT: "#f59e0b",
  Repas: "#ef4444",
  REPAS: "#ef4444",
  Transport: "#3b82f6",
  TRANSPORT: "#3b82f6",
  Outillage: "#8b5cf6",
  OUTILLAGE: "#8b5cf6",
  Autre: "#6b7280",
  AUTRE: "#6b7280",
};

const DEMO_DEPENSES: Depense[] = [
  { id: "1", montant: 342, date: "2026-03-12", fournisseur: "Leroy Merlin", categorie: "Matériaux", chantierNom: "Rénovation cuisine" },
  { id: "2", montant: 45.90, date: "2026-03-11", fournisseur: "Total Station", categorie: "Carburant" },
  { id: "3", montant: 18.50, date: "2026-03-11", fournisseur: "Brasserie du Lac", categorie: "Repas" },
  { id: "4", montant: 89, date: "2026-03-10", fournisseur: "Brico Dépôt", categorie: "Outillage", chantierNom: "Salle de bain" },
  { id: "5", montant: 567, date: "2026-03-09", fournisseur: "Point P", categorie: "Matériaux", chantierNom: "Rénovation cuisine" },
  { id: "6", montant: 22, date: "2026-03-08", fournisseur: "McDonald's", categorie: "Repas" },
  { id: "7", montant: 75, date: "2026-03-07", fournisseur: "Péage A64", categorie: "Transport" },
];

export default function BilanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterChantierId = searchParams.get("chantierId");
  const [depenses, setDepenses] = useState<Depense[]>(DEMO_DEPENSES);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Partial<Depense> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const url = filterChantierId ? `/api/depenses?chantierId=${filterChantierId}` : "/api/depenses";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) setDepenses(data);
        }
      } catch {}
    })();
  }, [filterChantierId]);

  const totalMois = useMemo(() => depenses.reduce((s, d) => s + d.montant, 0), [depenses]);

  const catData = useMemo(() => {
    const map: Record<string, number> = {};
    depenses.forEach((d) => { map[d.categorie] = (map[d.categorie] || 0) + d.montant; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [depenses]);

  const barData = useMemo(() => {
    const map: Record<string, number> = {};
    depenses.forEach((d) => {
      const key = d.chantierNom || "Non affecté";
      map[key] = (map[key] || 0) + d.montant;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [depenses]);

  const filtered = Array.isArray(depenses)
    ? depenses.filter((d) => {
        const matchSearch =
          !search ||
          d.fournisseur.toLowerCase().includes(search.toLowerCase()) ||
          d.categorie.toLowerCase().includes(search.toLowerCase());
        const matchCat = !filterCat || d.categorie === filterCat;
        return matchSearch && matchCat;
      })
    : [];

  const handleScan = async (file: File) => {
    setScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        try {
          const res = await fetch("/api/ai/analyse-ticket", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64 }),
          });
          if (res.ok) {
            const data = await res.json();
            setScanResult(data);
          }
        } catch {
          setScanResult({ montant: 0, fournisseur: "", categorie: "Autre", date: new Date().toISOString().slice(0, 10) });
        }
        setScanning(false);
        setShowAdd(true);
      };
      reader.readAsDataURL(file);
    } catch {
      setScanning(false);
    }
  };

  const exportCSV = () => {
    const header = "Date,Fournisseur,Catégorie,Montant,Chantier\n";
    const rows = depenses.map((d) => `${d.date},${d.fournisseur},${d.categorie},${d.montant},${d.chantierNom || ""}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "depenses.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bilan financier</h1>
          <p className="text-muted-foreground mt-1">
            {filterChantierId
              ? <span>Filtré par chantier — <button onClick={() => router.push("/admin/bilan")} className="text-[var(--primary)] hover:underline">Voir tout</button></span>
              : "Suivi des dépenses et rapports"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btp-btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <label className="btp-btn-primary flex items-center gap-2 px-4 py-2.5 font-semibold text-sm cursor-pointer">
            {scanning ? <><Loader2 className="h-4 w-4 animate-spin" /> Scan...</> : <><Camera className="h-4 w-4" /> Scanner un ticket</>}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleScan(e.target.files[0])} />
          </label>
          <button onClick={() => { setScanResult(null); setShowAdd(true); }} className="btp-btn-secondary flex items-center gap-2 px-4 py-2.5 font-medium text-sm">
            <Plus className="h-4 w-4" /> Saisie manuelle
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="btp-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Total du mois</p>
          <p className="text-2xl font-bold text-foreground">{formatMoney(totalMois)}</p>
        </div>
        <div className="btp-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Nombre de dépenses</p>
          <p className="text-2xl font-bold text-foreground">{depenses.length}</p>
        </div>
        <div className="btp-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Dépense moyenne</p>
          <p className="text-2xl font-bold text-foreground">{formatMoney(depenses.length > 0 ? totalMois / depenses.length : 0)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="btp-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par catégorie</h3>
          <div className="h-56">
            <BilanPieChart data={catData} colors={CATEGORIE_COLORS} formatMoneyFn={formatMoney} />
          </div>
        </div>
        <div className="btp-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par chantier</h3>
          <div className="h-56">
            <BilanBarChart data={barData} colors={CATEGORIE_COLORS} formatMoneyFn={formatMoney} />
          </div>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="btp-card p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-base font-semibold text-foreground">Toutes les dépenses</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
                className="btp-input pl-9 pr-3 py-2 text-sm w-48" />
            </div>
            <select value={filterCat || ""} onChange={(e) => setFilterCat(e.target.value || null)}
              className="btp-input px-3 py-2 text-sm w-auto">
              <option value="">Toutes catégories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0f0eb] text-left">
                <th className="pb-3 font-medium text-muted-foreground uppercase text-[11px] tracking-wider">Date</th>
                <th className="pb-3 font-medium text-muted-foreground uppercase text-[11px] tracking-wider">Fournisseur</th>
                <th className="pb-3 font-medium text-muted-foreground uppercase text-[11px] tracking-wider">Catégorie</th>
                <th className="pb-3 font-medium text-muted-foreground uppercase text-[11px] tracking-wider">Chantier</th>
                <th className="pb-3 font-medium text-muted-foreground uppercase text-[11px] tracking-wider text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0eb]">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-[#fafaf8] transition-colors">
                  <td className="py-3 text-muted-foreground">{new Date(d.date).toLocaleDateString("fr-FR")}</td>
                  <td className="py-3 text-foreground font-medium">{d.fournisseur}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: CATEGORIE_COLORS[d.categorie] || "#6b7280", color: "#ffffff" }}>
                      {d.categorie}
                    </span>
                  </td>
                  <td className="py-3">
                    {d.chantierId && d.chantierNom ? (
                      <button
                        onClick={() => router.push(`/admin/chantiers/${d.chantierId}`)}
                        className="text-[var(--primary)] hover:opacity-80 flex items-center gap-1 text-sm transition-colors"
                      >
                        {d.chantierNom} <ExternalLink className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="text-muted-foreground">{d.chantierNom || "—"}</span>
                    )}
                  </td>
                  <td className="py-3 text-foreground font-semibold text-right">{formatMoney(d.montant)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add depense modal */}
      {showAdd && <AddDepenseModal scanResult={scanResult} onClose={() => { setShowAdd(false); setScanResult(null); }} onAdd={(d) => { setDepenses((ps) => [d, ...ps]); setShowAdd(false); setScanResult(null); }} />}
    </div>
  );
}

function AddDepenseModal({ onClose, onAdd, scanResult }: { onClose: () => void; onAdd: (d: Depense) => void; scanResult: Partial<Depense> | null }) {
  const [form, setForm] = useState({
    montant: scanResult?.montant?.toString() || "",
    date: scanResult?.date || new Date().toISOString().slice(0, 10),
    fournisseur: scanResult?.fournisseur || "",
    categorie: scanResult?.categorie || "Autre",
    chantierId: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [chantiers, setChantiers] = useState<{ id: string; nom: string }[]>([]);

  useEffect(() => {
    fetch("/api/chantiers")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (Array.isArray(data)) setChantiers(data.map((c: any) => ({ id: c.id, nom: c.nom })));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const selectedChantier = chantiers.find((c) => c.id === form.chantierId);
    const depense: Depense = {
      ...form,
      montant: parseFloat(form.montant) || 0,
      id: Date.now().toString(),
      chantierId: form.chantierId || null,
      chantierNom: selectedChantier?.nom,
    };
    try {
      const res = await fetch("/api/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(depense),
      });
      if (res.ok) { onAdd(await res.json()); return; }
    } catch {}
    onAdd(depense);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md mx-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {scanResult ? <><Sparkles className="h-4 w-4 text-[var(--primary)]" /> Dépense scannée</> : "Nouvelle dépense"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MField label="Montant (€) *" type="number" value={form.montant} onChange={(v) => setForm({ ...form, montant: v })} required />
            <MField label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          </div>
          <MField label="Fournisseur" value={form.fournisseur} onChange={(v) => setForm({ ...form, fournisseur: v })} />
          <div>
            <label className="block text-[13px] font-medium text-muted-foreground mb-1.5">Catégorie</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, categorie: c })}
                  className={`px-2.5 py-1 rounded-[10px] text-xs font-medium transition-colors border border-border ${form.categorie === c ? "text-foreground bg-[#f0f0eb]" : "bg-[#f5f5f0] text-muted-foreground hover:text-foreground hover:bg-[#f0f0eb]"}`}
                  style={form.categorie === c ? { backgroundColor: CATEGORIE_COLORS[c] } : {}}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-muted-foreground mb-1">Chantier (optionnel)</label>
            <select
              value={form.chantierId}
              onChange={(e) => setForm({ ...form, chantierId: e.target.value })}
              className="btp-input px-3 py-2 text-sm w-full"
            >
              <option value="">-- Non affecté --</option>
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={saving || !form.montant}
            className="btp-btn-primary w-full flex items-center justify-center gap-2 font-semibold py-2.5 transition-colors">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</> : <><CheckCircle2 className="h-4 w-4" /> Enregistrer</>}
          </button>
        </form>
      </div>
    </div>
  );
}

function MField({ label, value, onChange, placeholder, type = "text", required = false }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-muted-foreground mb-1">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="btp-input px-3 py-2 text-sm" />
    </div>
  );
}
