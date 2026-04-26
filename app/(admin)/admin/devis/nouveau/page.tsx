"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Send, Save, ChevronLeft } from "lucide-react";
import { formatMoney } from "@/lib/utils";

type SourceType = "client" | "prospect" | "manuel";
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

interface Client { id: string; nom: string; prenom?: string; email?: string; telephone?: string; adresse?: string; }
interface Prospect { id: string; nom: string; email?: string; telephone?: string; }

const DEFAULT_DATE_VALIDITE = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

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

export default function NouveauDevisPage() {
  const router = useRouter();
  const [source, setSource] = useState<SourceType>("manuel");
  const [clients, setClients] = useState<Client[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProspectId, setSelectedProspectId] = useState("");

  const [clientNom, setClientNom] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientTelephone, setClientTelephone] = useState("");
  const [clientAdresse, setClientAdresse] = useState("");
  const [chantierAdresse, setChantierAdresse] = useState("");
  const [dateValidite, setDateValidite] = useState(DEFAULT_DATE_VALIDITE());

  const [lignes, setLignes] = useState<Ligne[]>([newLigne()]);
  const [acomptePct, setAcomptePct] = useState("30");
  const [conditionsPaiement, setConditionsPaiement] = useState("30% à la signature, solde à la fin des travaux");
  const [notes, setNotes] = useState("");
  const [mentionDechets, setMentionDechets] = useState("Conformément à la loi du 10/02/2020, les déchets de chantier seront évacués et traités dans des filières agréées.");

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/clients").then(r => r.ok ? r.json() : []).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/prospects").then(r => r.ok ? r.json() : []).then(d => setProspects(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (source === "client" && selectedClientId) {
      const c = clients.find(x => x.id === selectedClientId);
      if (c) {
        setClientNom(`${c.nom}${c.prenom ? " " + c.prenom : ""}`);
        setClientEmail(c.email || "");
        setClientTelephone(c.telephone || "");
        setClientAdresse(c.adresse || "");
      }
    }
  }, [selectedClientId, clients, source]);

  useEffect(() => {
    if (source === "prospect" && selectedProspectId) {
      const p = prospects.find(x => x.id === selectedProspectId);
      if (p) {
        setClientNom(p.nom);
        setClientEmail(p.email || "");
        setClientTelephone(p.telephone || "");
        setClientAdresse("");
      }
    }
  }, [selectedProspectId, prospects, source]);

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

  const updateLigne = useCallback((id: string, field: keyof Ligne, value: string) => {
    setLignes(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  }, []);

  const addLigne = useCallback(() => setLignes(prev => [...prev, newLigne()]), []);
  const removeLigne = useCallback((id: string) => setLignes(prev => prev.filter(l => l.id !== id)), []);

  const buildPayload = (statut: string) => ({
    statut,
    clientId: source === "client" ? selectedClientId || null : null,
    prospectId: source === "prospect" ? selectedProspectId || null : null,
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
  });

  const handleSave = async () => {
    if (!clientNom.trim()) return alert("Le nom du client est requis.");
    if (lignes.length === 0) return alert("Au moins une ligne de prestation est requise.");
    setSaving(true);
    try {
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload("brouillon")),
      });
      if (res.ok) {
        router.push("/admin/devis");
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la création");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!clientNom.trim()) return alert("Le nom du client est requis.");
    if (!clientEmail.trim()) return alert("L'email client est requis pour envoyer.");
    if (lignes.length === 0) return alert("Au moins une ligne de prestation est requise.");
    setSending(true);
    try {
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload("brouillon")),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur lors de la création");
        return;
      }
      const created = await res.json();
      const sendRes = await fetch(`/api/devis/${created.id}/send`, { method: "POST" });
      if (sendRes.ok) {
        router.push("/admin/devis");
      } else {
        const err = await sendRes.json();
        alert(err.error || "Erreur lors de l'envoi");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btp-btn-secondary p-2 rounded-xl">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Nouveau devis</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Le numéro sera généré automatiquement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section 1 — Client */}
          <div className="btp-card p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Client / Destinataire</h2>

            <div className="flex gap-2 flex-wrap">
              {(["client", "prospect", "manuel"] as SourceType[]).map(s => (
                <button key={s} type="button"
                  onClick={() => setSource(s)}
                  className={`px-3 py-1.5 rounded-[10px] text-sm font-medium border transition-colors ${source === s ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-[#f5f5f0] text-foreground border-border hover:bg-[#f0f0eb]"}`}>
                  {s === "client" ? "Client existant" : s === "prospect" ? "Prospect CRM" : "Saisie manuelle"}
                </button>
              ))}
            </div>

            {source === "client" && (
              <div>
                <label className="block text-[13px] font-medium text-muted-foreground mb-1">Choisir un client</label>
                <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="btp-input px-3 py-2 text-sm">
                  <option value="">-- Sélectionner --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nom}{c.prenom ? " " + c.prenom : ""}</option>)}
                </select>
              </div>
            )}
            {source === "prospect" && (
              <div>
                <label className="block text-[13px] font-medium text-muted-foreground mb-1">Choisir un prospect</label>
                <select value={selectedProspectId} onChange={e => setSelectedProspectId(e.target.value)} className="btp-input px-3 py-2 text-sm">
                  <option value="">-- Sélectionner --</option>
                  {prospects.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nom / Raison sociale *" value={clientNom} onChange={setClientNom} />
              <Field label="Email" value={clientEmail} onChange={setClientEmail} type="email" />
              <Field label="Téléphone" value={clientTelephone} onChange={setClientTelephone} />
              <Field label="Adresse client" value={clientAdresse} onChange={setClientAdresse} />
            </div>
          </div>

          {/* Section 2 — Chantier */}
          <div className="btp-card p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">Chantier</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Adresse du chantier" value={chantierAdresse} onChange={setChantierAdresse} />
              <Field label="Date de validité" value={dateValidite} onChange={setDateValidite} type="date" />
            </div>
          </div>

          {/* Section 3 — Lignes */}
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

          {/* Section 5 — Conditions */}
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

            <div className="border-t border-[#f0f0eb] pt-3 space-y-2">
              <button onClick={handleSave} disabled={saving || sending}
                className="btp-btn-secondary w-full flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-sm border border-border">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="h-4 w-4" /> Enregistrer brouillon</>}
              </button>
              <button onClick={handleSend} disabled={saving || sending}
                className="btp-btn-primary w-full flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-sm">
                {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</> : <><Send className="h-4 w-4" /> Enregistrer et envoyer</>}
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
