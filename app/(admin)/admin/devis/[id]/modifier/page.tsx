"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Trash2, Loader2, Save, ChevronLeft } from "lucide-react";
import { formatMoney } from "@/lib/utils";

type Unite = "m²" | "ml" | "h" | "forfait" | "u";
type TvaTaux = "20" | "10" | "5.5" | "exempt";

interface Ligne {
  id: string;
  description: string;
  quantite: string;
  unite: Unite;
  prixUnitaireHt: string;
  tvaTaux: TvaTaux;
}

const newLigne = (): Ligne => ({
  id: Math.random().toString(36).slice(2),
  description: "",
  quantite: "1",
  unite: "forfait",
  prixUnitaireHt: "",
  tvaTaux: "20",
});

const TVA_OPTIONS: { value: TvaTaux; label: string }[] = [
  { value: "20", label: "20%" },
  { value: "10", label: "10%" },
  { value: "5.5", label: "5.5%" },
  { value: "exempt", label: "Exonéré (art.293B CGI)" },
];

const UNITE_OPTIONS: Unite[] = ["m²", "ml", "h", "forfait", "u"];

function calcLigne(l: Ligne) {
  const qty = parseFloat(l.quantite) || 0;
  const pu = parseFloat(l.prixUnitaireHt) || 0;
  const ht = qty * pu;
  const tvaRate = l.tvaTaux === "exempt" ? 0 : parseFloat(l.tvaTaux) || 0;
  const tva = ht * (tvaRate / 100);
  return { ht, tva, ttc: ht + tva };
}

export default function ModifierDevisPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [numero, setNumero] = useState("");

  const [clientNom, setClientNom] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientTelephone, setClientTelephone] = useState("");
  const [clientAdresse, setClientAdresse] = useState("");
  const [chantierAdresse, setChantierAdresse] = useState("");
  const [dateValidite, setDateValidite] = useState("");

  const [lignes, setLignes] = useState<Ligne[]>([newLigne()]);
  const [acomptePct, setAcomptePct] = useState("30");
  const [conditionsPaiement, setConditionsPaiement] = useState("");
  const [notes, setNotes] = useState("");
  const [mentionDechets, setMentionDechets] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/devis/${id}`);
        if (!res.ok) {
          router.replace(`/admin/devis/${id}`);
          return;
        }
        const d = await res.json();
        if (d.statut !== "brouillon") {
          router.replace(`/admin/devis/${id}`);
          return;
        }
        setNumero(d.numero || "");
        setClientNom(d.clientNom || "");
        setClientEmail(d.clientEmail || "");
        setClientTelephone(d.clientTelephone || "");
        setClientAdresse(d.clientAdresse || "");
        setChantierAdresse(d.chantierAdresse || "");
        setDateValidite(d.dateValidite ? d.dateValidite.slice(0, 10) : "");
        setAcomptePct(String(d.acomptePourcentage ?? 30));
        setConditionsPaiement(d.conditionsPaiement || "");
        setNotes(d.notes || "");
        setMentionDechets(d.mentionDechets || "");
        if (Array.isArray(d.lignes) && d.lignes.length > 0) {
          setLignes(
            d.lignes.map((l: any) => ({
              id: Math.random().toString(36).slice(2),
              description: l.description || "",
              quantite: String(l.quantite ?? 1),
              unite: (l.unite as Unite) || "forfait",
              prixUnitaireHt: String(l.prixUnitaireHt ?? ""),
              tvaTaux: (String(l.tvaTaux) as TvaTaux) || "20",
            }))
          );
        }
      } catch {
        router.replace(`/admin/devis/${id}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const totaux = useMemo(() => {
    let totalHt = 0;
    let tvaMontant = 0;
    const tvaParTaux: Record<string, number> = {};
    for (const l of lignes) {
      const { ht, tva } = calcLigne(l);
      totalHt += ht;
      tvaMontant += tva;
      const key = l.tvaTaux;
      if (key !== "exempt") tvaParTaux[key] = (tvaParTaux[key] || 0) + tva;
    }
    const totalTtc = totalHt + tvaMontant;
    const acompte = totalTtc * ((parseFloat(acomptePct) || 0) / 100);
    return { totalHt, tvaMontant, totalTtc, acompte, tvaParTaux };
  }, [lignes, acomptePct]);

  const updateLigne = useCallback((lid: string, field: keyof Ligne, value: string) => {
    setLignes(prev => prev.map(l => l.id === lid ? { ...l, [field]: value } : l));
  }, []);

  const addLigne = useCallback(() => setLignes(prev => [...prev, newLigne()]), []);
  const removeLigne = useCallback((lid: string) => setLignes(prev => prev.filter(l => l.id !== lid)), []);

  const handleSave = async () => {
    if (!clientNom.trim()) return alert("Le nom du client est requis.");
    if (lignes.length === 0) return alert("Au moins une ligne de prestation est requise.");
    setSaving(true);
    try {
      const res = await fetch(`/api/devis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientNom,
          clientEmail: clientEmail || null,
          clientTelephone: clientTelephone || null,
          clientAdresse: clientAdresse || null,
          chantierAdresse: chantierAdresse || null,
          dateValidite,
          lignes: lignes.map(l => ({
            description: l.description,
            quantite: parseFloat(l.quantite) || 0,
            unite: l.unite,
            prixUnitaireHt: parseFloat(l.prixUnitaireHt) || 0,
            tvaTaux: l.tvaTaux,
          })),
          acomptePourcentage: parseFloat(acomptePct) || 30,
          conditionsPaiement,
          notes: notes || null,
          mentionDechets,
        }),
      });
      if (res.ok) {
        router.push(`/admin/devis/${id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#f0f0eb] animate-pulse" />
          <div className="h-7 w-48 rounded bg-[#f0f0eb] animate-pulse" />
        </div>
        <div className="btp-card p-6 animate-pulse h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(`/admin/devis/${id}`)} className="btp-btn-secondary p-2 rounded-xl">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Modifier {numero}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Brouillon — modifications autorisées</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">

          {/* Client */}
          <div className="btp-card p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Client / Destinataire</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nom / Raison sociale *" value={clientNom} onChange={setClientNom} />
              <Field label="Email" value={clientEmail} onChange={setClientEmail} type="email" />
              <Field label="Téléphone" value={clientTelephone} onChange={setClientTelephone} />
              <Field label="Adresse client" value={clientAdresse} onChange={setClientAdresse} />
            </div>
          </div>

          {/* Chantier */}
          <div className="btp-card p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">Chantier</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Adresse du chantier" value={chantierAdresse} onChange={setChantierAdresse} />
              <Field label="Date de validité" value={dateValidite} onChange={setDateValidite} type="date" />
            </div>
          </div>

          {/* Lignes */}
          <div className="btp-card p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Prestations</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0f0eb]">
                    <th className="text-left pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider pr-2">Description</th>
                    <th className="text-center pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-16">Qté</th>
                    <th className="text-center pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-24">Unité</th>
                    <th className="text-right pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-28">Prix HT</th>
                    <th className="text-center pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-36">TVA</th>
                    <th className="text-right pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-28">Total TTC</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0eb]">
                  {lignes.map(l => {
                    const { ttc } = calcLigne(l);
                    return (
                      <tr key={l.id}>
                        <td className="py-2 pr-2">
                          <input value={l.description} onChange={e => updateLigne(l.id, "description", e.target.value)}
                            placeholder="Description de la prestation"
                            className="btp-input px-2 py-1.5 text-sm" />
                        </td>
                        <td className="py-2 px-1">
                          <input type="number" value={l.quantite} onChange={e => updateLigne(l.id, "quantite", e.target.value)}
                            min="0" step="0.01"
                            className="btp-input px-2 py-1.5 text-sm text-center" />
                        </td>
                        <td className="py-2 px-1">
                          <select value={l.unite} onChange={e => updateLigne(l.id, "unite", e.target.value as Unite)}
                            className="btp-input px-2 py-1.5 text-sm">
                            {UNITE_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="py-2 px-1">
                          <input type="number" value={l.prixUnitaireHt} onChange={e => updateLigne(l.id, "prixUnitaireHt", e.target.value)}
                            min="0" step="0.01" placeholder="0.00"
                            className="btp-input px-2 py-1.5 text-sm text-right" />
                        </td>
                        <td className="py-2 px-1">
                          <select value={l.tvaTaux} onChange={e => updateLigne(l.id, "tvaTaux", e.target.value as TvaTaux)}
                            className="btp-input px-2 py-1.5 text-sm">
                            {TVA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </td>
                        <td className="py-2 px-1 text-right font-medium text-foreground whitespace-nowrap">
                          {formatMoney(ttc)}
                        </td>
                        <td className="py-2 pl-1">
                          {lignes.length > 1 && (
                            <button type="button" onClick={() => removeLigne(l.id)}
                              className="text-muted-foreground hover:text-[var(--destructive)] transition-colors p-1">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addLigne}
              className="btp-btn-secondary flex items-center gap-2 px-3 py-2 text-sm">
              <Plus className="h-4 w-4" /> Ajouter une ligne
            </button>
          </div>

          {/* Conditions */}
          <div className="btp-card p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">Conditions</h2>
            <div>
              <label className="block text-[13px] font-medium text-muted-foreground mb-1">Conditions de paiement</label>
              <textarea value={conditionsPaiement} onChange={e => setConditionsPaiement(e.target.value)} rows={2}
                className="btp-input px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-muted-foreground mb-1">Notes / Observations</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Informations complémentaires..."
                className="btp-input px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-muted-foreground mb-1">Gestion des déchets</label>
              <textarea value={mentionDechets} onChange={e => setMentionDechets(e.target.value)} rows={2}
                className="btp-input px-3 py-2 text-sm resize-none" />
            </div>
          </div>
        </div>

        {/* Colonne sticky — Totaux */}
        <div className="space-y-4">
          <div className="btp-card p-5 space-y-3 lg:sticky lg:top-6">
            <h2 className="text-base font-semibold text-foreground">Récapitulatif</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total HT</span>
                <span className="font-medium">{formatMoney(totaux.totalHt)}</span>
              </div>
              {Object.entries(totaux.tvaParTaux).map(([taux, montant]) => (
                <div key={taux} className="flex justify-between">
                  <span className="text-muted-foreground">TVA {taux}%</span>
                  <span className="font-medium">{formatMoney(montant)}</span>
                </div>
              ))}
              <div className="border-t border-[#f0f0eb] pt-2 flex justify-between">
                <span className="font-semibold text-foreground">Total TTC</span>
                <span className="font-bold text-lg text-[var(--primary)]">{formatMoney(totaux.totalTtc)}</span>
              </div>
            </div>

            <div className="border-t border-[#f0f0eb] pt-3 space-y-1">
              <label className="block text-[13px] font-medium text-muted-foreground">Acompte (%)</label>
              <div className="flex items-center gap-2">
                <input type="number" value={acomptePct} onChange={e => setAcomptePct(e.target.value)}
                  min="0" max="100" className="btp-input px-3 py-2 text-sm w-20" />
                <span className="text-sm text-muted-foreground">=</span>
                <span className="text-sm font-medium text-foreground">{formatMoney(totaux.acompte)}</span>
              </div>
            </div>

            <div className="border-t border-[#f0f0eb] pt-3">
              <button onClick={handleSave} disabled={saving}
                className="btp-btn-primary w-full flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-sm">
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</>
                  : <><Save className="h-4 w-4" /> Enregistrer les modifications</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-muted-foreground mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="btp-input px-3 py-2 text-sm" />
    </div>
  );
}
