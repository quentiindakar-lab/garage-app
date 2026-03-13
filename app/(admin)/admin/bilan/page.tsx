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
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

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
const CAT_COLORS: Record<string, string> = {
  Repas: "#F59E0B",
  Carburant: "#3B82F6",
  Matériaux: "#10B981",
  Outillage: "#8B5CF6",
  Transport: "#EF4444",
  Autre: "#6B7280",
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

  const filtered = depenses.filter((d) => {
    const matchSearch = !search || d.fournisseur.toLowerCase().includes(search.toLowerCase()) || d.categorie.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || d.categorie === filterCat;
    return matchSearch && matchCat;
  });

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
          <h1 className="text-3xl font-bold text-white">Bilan financier</h1>
          <p className="text-slate-400 mt-1">
            {filterChantierId
              ? <span>Filtré par chantier — <button onClick={() => router.push("/admin/bilan")} className="text-amber-400 hover:underline">Voir tout</button></span>
              : "Suivi des dépenses et rapports"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-sm text-slate-300 hover:text-white transition-colors">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm transition-colors cursor-pointer">
            {scanning ? <><Loader2 className="h-4 w-4 animate-spin" /> Scan...</> : <><Camera className="h-4 w-4" /> Scanner un ticket</>}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleScan(e.target.files[0])} />
          </label>
          <button onClick={() => { setScanResult(null); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-medium text-sm transition-colors">
            <Plus className="h-4 w-4" /> Saisie manuelle
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400 mb-1">Total du mois</p>
          <p className="text-2xl font-bold text-white">{formatMoney(totalMois)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400 mb-1">Nombre de dépenses</p>
          <p className="text-2xl font-bold text-white">{depenses.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400 mb-1">Dépense moyenne</p>
          <p className="text-2xl font-bold text-white">{formatMoney(depenses.length > 0 ? totalMois / depenses.length : 0)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Répartition par catégorie</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {catData.map((d) => <Cell key={d.name} fill={CAT_COLORS[d.name] || "#6B7280"} />)}
                </Pie>
                <RTooltip formatter={(v) => [formatMoney(Number(v)), ""]} contentStyle={{ borderRadius: 8, background: "#1e293b", border: "1px solid #334155", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Répartition par chantier</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}€`} />
                <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} width={120} />
                <RTooltip formatter={(v) => [formatMoney(Number(v)), "Dépenses"]} contentStyle={{ borderRadius: 8, background: "#1e293b", border: "1px solid #334155", color: "#fff" }} />
                <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-base font-semibold text-white">Toutes les dépenses</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
                className="pl-9 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-48" />
            </div>
            <select value={filterCat || ""} onChange={(e) => setFilterCat(e.target.value || null)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:outline-none">
              <option value="">Toutes catégories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="pb-3 font-medium text-slate-400">Date</th>
                <th className="pb-3 font-medium text-slate-400">Fournisseur</th>
                <th className="pb-3 font-medium text-slate-400">Catégorie</th>
                <th className="pb-3 font-medium text-slate-400">Chantier</th>
                <th className="pb-3 font-medium text-slate-400 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 text-slate-300">{new Date(d.date).toLocaleDateString("fr-FR")}</td>
                  <td className="py-3 text-white font-medium">{d.fournisseur}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: (CAT_COLORS[d.categorie] || "#6B7280") + "20", color: CAT_COLORS[d.categorie] || "#6B7280" }}>
                      {d.categorie}
                    </span>
                  </td>
                  <td className="py-3">
                    {d.chantierId && d.chantierNom ? (
                      <button onClick={() => router.push(`/admin/chantiers/${d.chantierId}`)}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-sm transition-colors">
                        {d.chantierNom} <ExternalLink className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="text-slate-400">{d.chantierNom || "—"}</span>
                    )}
                  </td>
                  <td className="py-3 text-white font-semibold text-right">{formatMoney(d.montant)}</td>
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
    chantierNom: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const depense: Depense = { ...form, montant: parseFloat(form.montant) || 0, id: Date.now().toString() };
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
      <div className="w-full max-w-md mx-4 rounded-xl border border-slate-700 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {scanResult ? <><Sparkles className="h-4 w-4 text-amber-400" /> Dépense scannée</> : "Nouvelle dépense"}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MField label="Montant (€) *" type="number" value={form.montant} onChange={(v) => setForm({ ...form, montant: v })} required />
            <MField label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          </div>
          <MField label="Fournisseur" value={form.fournisseur} onChange={(v) => setForm({ ...form, fournisseur: v })} />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Catégorie</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, categorie: c })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${form.categorie === c ? "text-slate-900" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                  style={form.categorie === c ? { backgroundColor: CAT_COLORS[c] } : {}}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <MField label="Chantier (optionnel)" value={form.chantierNom} onChange={(v) => setForm({ ...form, chantierNom: v })} placeholder="Nom du chantier" />
          <button type="submit" disabled={saving || !form.montant}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-900 disabled:text-slate-500 font-semibold py-2.5 rounded-lg transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
}

function MField({ label, value, onChange, placeholder, type = "text", required = false }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
    </div>
  );
}
