"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BTP_CONFIG } from "@/config/btp.config";
import { formatMoney } from "@/lib/utils";
import {
  Sparkles,
  Clock,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  X,
  Wrench,
  Lightbulb,
  TrendingUp,
  ShieldAlert,
  FileDown,
  HardHat,
  Search,
  Save,
  ExternalLink,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";

interface EstimationResult {
  estimationId?: string;
  duree_estimee: string;
  nombre_ouvriers: number;
  materiaux: { nom: string; quantite: string; cout_unitaire: number; cout_total: number }[];
  couts: {
    main_oeuvre: number;
    materiaux: number;
    transport: number;
    autres: number;
    total_ht: number;
    marge: number;
    total_ttc: number;
  };
  recommandations: string[];
  risques: string[];
}

interface ClientOption {
  id: string;
  nom: string;
  prenom?: string;
  email?: string;
}

const PIE_COLORS = ["#F59E0B", "#3B82F6", "#10B981", "#8B5CF6"];

export default function EstimationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chantierId = searchParams.get("chantier") || null;

  const [form, setForm] = useState({
    nom: "", adresse: "", surface: "", description: "",
    materiaux: "", localisation: "", delai: "", marge: "20",
    metiers: [] as string[],
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showChantierModal, setShowChantierModal] = useState(false);
  const [chantierForm, setChantierForm] = useState({
    nom: "", adresse: "", surface: "", type: "", dateDebut: "", dateFin: "", clientId: "",
  });
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<ClientOption[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [creatingChantier, setCreatingChantier] = useState(false);
  const [createdChantierId, setCreatedChantierId] = useState<string | null>(null);
  const clientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clientSearch.length < 1) { setClientResults([]); return; }
    const t = setTimeout(() => {
      fetch("/api/clients")
        .then((r) => r.json())
        .then((data: ClientOption[]) => {
          const q = clientSearch.toLowerCase();
          const filtered = Array.isArray(data)
            ? data.filter((c) => c.nom.toLowerCase().includes(q) || c.prenom?.toLowerCase().includes(q))
            : [];
          setClientResults(filtered.slice(0, 5));
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) setShowClientDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleMetier = (m: string) =>
    setForm((p) => ({
      ...p,
      metiers: p.metiers.includes(m) ? p.metiers.filter((x) => x !== m) : [...p.metiers, m],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null); setCreatedChantierId(null);
    try {
      const res = await fetch("/api/ai/estimation-chantier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          surface: form.surface ? parseFloat(form.surface) : null,
          delaiSouhaite: form.delai ? parseInt(form.delai) : null,
          margePercent: parseInt(form.marge),
          chantierId,
        }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      setResult(await res.json());
    } catch {
      setError("Impossible de générer l'estimation. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const openChantierModal = () => {
    if (!result) return;
    const dureeWeeks = parseInt(result.duree_estimee) || 4;
    const debut = new Date();
    debut.setDate(debut.getDate() + 7);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + dureeWeeks * 7);
    setChantierForm({
      nom: form.nom || "Nouveau chantier",
      adresse: form.adresse || "",
      surface: form.surface || "",
      type: form.metiers[0] || "",
      dateDebut: debut.toISOString().slice(0, 10),
      dateFin: fin.toISOString().slice(0, 10),
      clientId: "",
    });
    setSelectedClient(null);
    setShowChantierModal(true);
  };

  const handleCreateChantier = async () => {
    setCreatingChantier(true);
    try {
      const res = await fetch("/api/chantiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: chantierForm.nom,
          adresse: chantierForm.adresse,
          surface: chantierForm.surface ? parseFloat(chantierForm.surface) : null,
          type: chantierForm.type || null,
          dateDebut: chantierForm.dateDebut || null,
          dateFin: chantierForm.dateFin || null,
          statut: "DEVIS_ENVOYE",
          clientId: selectedClient?.id || null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setCreatedChantierId(created.id);
        setShowChantierModal(false);
      }
    } catch {} finally { setCreatingChantier(false); }
  };

  const pieData = result
    ? [
        { name: "Main-d'oeuvre", value: result.couts.main_oeuvre },
        { name: "Matériaux", value: result.couts.materiaux },
        { name: "Transport", value: result.couts.transport },
        { name: "Autres", value: result.couts.autres },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Estimation IA</h1>
        <p className="text-gray-500 mt-1">Obtenez une estimation détaillée générée par l&apos;intelligence artificielle</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left - Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-[#4a7c59]" /> Données du chantier
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nom / référence" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} placeholder="Chantier cuisine" />
              <Field label="Adresse" value={form.adresse} onChange={(v) => setForm({ ...form, adresse: v })} placeholder="12 rue..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Surface (m²)" type="number" value={form.surface} onChange={(v) => setForm({ ...form, surface: v })} placeholder="45" />
              <Field label="Délai (semaines)" type="number" value={form.delai} onChange={(v) => setForm({ ...form, delai: v })} placeholder="3" />
              <Field label="Localisation" value={form.localisation} onChange={(v) => setForm({ ...form, localisation: v })} placeholder="Pau" />
            </div>
            <Field label="Matériaux disponibles" value={form.materiaux} onChange={(v) => setForm({ ...form, materiaux: v })} placeholder="Carrelage, placo..." />
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 resize-none" placeholder="Travaux à réaliser..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Type de travaux</label>
              <div className="flex flex-wrap gap-1.5">
                {BTP_CONFIG.metiers.map((m) => (
                  <button key={m} type="button" onClick={() => toggleMetier(m)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.metiers.includes(m) ? "bg-[#4a7c59] text-white" : "bg-gray-100 text-gray-600 border border-gray-200 hover:text-gray-900"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Marge souhaitée : <span className="text-[#4a7c59] font-bold">{form.marge}%</span>
              </label>
              <input type="range" min="10" max="50" value={form.marge} onChange={(e) => setForm({ ...form, marge: e.target.value })} className="w-full accent-[#4a7c59]" />
              <div className="flex justify-between text-[10px] text-gray-400"><span>10%</span><span>50%</span></div>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Photos</label>
              <div className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <img src={URL.createObjectURL(p)} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#4a7c59]/50 transition-colors">
                  <Plus className="h-4 w-4 text-gray-400" />
                  <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && setPhotos((p) => [...p, ...Array.from(e.target.files!)])} className="hidden" />
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#f59e0b] hover:bg-[#e8960a] disabled:bg-gray-200 text-black disabled:text-gray-400 font-semibold py-3 rounded-lg transition-colors">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Estimation en cours...</> : <><Sparkles className="h-4 w-4" /> Générer l&apos;estimation</>}
            </button>
          </form>
        </div>

        {/* Right - Results */}
        <div className="space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="rounded-2xl border border-gray-200 bg-white p-16 flex flex-col items-center text-center shadow-sm">
              <Sparkles className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400">Résultats de l&apos;estimation</h3>
              <p className="text-sm text-gray-400 mt-2">Remplissez le formulaire et cliquez sur &quot;Générer&quot;</p>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white p-16 flex flex-col items-center shadow-sm">
              <Loader2 className="h-10 w-10 text-[#4a7c59] animate-spin mb-4" />
              <p className="text-sm text-gray-500">L&apos;IA analyse votre chantier...</p>
            </div>
          )}

          {result && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <KpiCard icon={Clock} label="Durée estimée" value={result.duree_estimee} color="amber" />
                <KpiCard icon={Users} label="Ouvriers requis" value={String(result.nombre_ouvriers)} color="blue" />
                <KpiCard icon={DollarSign} label="Total TTC" value={formatMoney(result.couts.total_ttc)} color="emerald" />
                <KpiCard icon={TrendingUp} label="Marge" value={formatMoney(result.couts.marge)} color="purple" />
              </div>

              {/* Pie chart */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Répartition des coûts</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [formatMoney(Number(v)), ""]} contentStyle={{ borderRadius: 8, background: "#fff", border: "1px solid #e5e7eb", color: "#111827" }} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#6b7280" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Materiaux table */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-[#4a7c59]" /> Matériaux nécessaires
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left">
                        <th className="pb-2 font-medium text-gray-500">Matériau</th>
                        <th className="pb-2 font-medium text-gray-500">Quantité</th>
                        <th className="pb-2 font-medium text-gray-500 text-right">P.U.</th>
                        <th className="pb-2 font-medium text-gray-500 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.materiaux.map((m, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-2 text-gray-700">{m.nom}</td>
                          <td className="py-2 text-gray-500">{m.quantite}</td>
                          <td className="py-2 text-gray-500 text-right">{formatMoney(m.cout_unitaire)}</td>
                          <td className="py-2 text-gray-900 font-medium text-right">{formatMoney(m.cout_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommandations + Risques */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-[#4a7c59]" /> Recommandations
                  </h3>
                  <div className="space-y-2">
                    {result.recommandations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-xs text-gray-600">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-400" /> Risques identifiés
                  </h3>
                  <div className="space-y-2">
                    {result.risques.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-xs text-gray-600">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {createdChantierId ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <p className="text-sm text-emerald-700">Chantier créé avec succès !</p>
                  </div>
                  <button onClick={() => router.push(`/admin/chantiers/${createdChantierId}`)}
                    className="flex items-center gap-2 text-sm font-medium text-[#4a7c59] hover:text-[#3d6a4a]">
                    Voir le chantier <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm">
                    <FileDown className="h-4 w-4" /> Exporter en PDF
                  </button>
                  <button onClick={openChantierModal}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#4a7c59] text-white text-sm font-semibold transition-colors hover:bg-[#3d6a4a] shadow-sm">
                    <Save className="h-4 w-4" /> Enregistrer comme chantier
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal création chantier depuis estimation */}
      {showChantierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowChantierModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <HardHat className="h-5 w-5 text-[#4a7c59]" /> Créer le chantier
              </h2>
              <button onClick={() => setShowChantierModal(false)} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nom du chantier" value={chantierForm.nom} onChange={(v) => setChantierForm({ ...chantierForm, nom: v })} />
                <Field label="Adresse" value={chantierForm.adresse} onChange={(v) => setChantierForm({ ...chantierForm, adresse: v })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Surface (m²)" value={chantierForm.surface} onChange={(v) => setChantierForm({ ...chantierForm, surface: v })} type="number" />
                <Field label="Date début" value={chantierForm.dateDebut} onChange={(v) => setChantierForm({ ...chantierForm, dateDebut: v })} type="date" />
                <Field label="Date fin" value={chantierForm.dateFin} onChange={(v) => setChantierForm({ ...chantierForm, dateFin: v })} type="date" />
              </div>

              {result?.couts?.total_ttc && (
                <div className="rounded-lg border border-[#4a7c59]/30 bg-[#4a7c59]/5 p-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Budget estimé (TTC)</span>
                  <span className="text-lg font-bold text-[#4a7c59]">{formatMoney(result.couts.total_ttc)}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Client</label>
                {selectedClient ? (
                  <div className="flex items-center justify-between rounded-lg border border-[#4a7c59]/30 bg-[#4a7c59]/5 p-3">
                    <p className="text-sm font-medium text-gray-900">{selectedClient.nom} {selectedClient.prenom || ""}</p>
                    <button onClick={() => setSelectedClient(null)} className="text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div ref={clientRef} className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un client..."
                      value={clientSearch}
                      onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                      onFocus={() => setShowClientDropdown(true)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                    />
                    {showClientDropdown && clientResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                        {clientResults.map((c) => (
                          <button key={c.id} type="button"
                            onClick={() => { setSelectedClient(c); setShowClientDropdown(false); setClientSearch(""); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg">
                            <span className="font-medium text-gray-900">{c.nom} {c.prenom || ""}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowChantierModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
              <button onClick={handleCreateChantier} disabled={!chantierForm.nom.trim() || !chantierForm.adresse.trim() || creatingChantier}
                className="flex items-center gap-2 rounded-lg bg-[#4a7c59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d6a4a] shadow-sm disabled:opacity-50">
                {creatingChantier && <Loader2 className="h-4 w-4 animate-spin" />} Créer le chantier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30" />
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: string; color: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
  };
  const c = colors[color] || colors.amber;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${c.bg}`}><Icon className={`h-3.5 w-3.5 ${c.text}`} /></div>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
