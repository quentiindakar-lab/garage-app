"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  HardHat,
  X,
} from "lucide-react";
import { formatMoney } from "@/lib/utils";

interface Ligne {
  description: string;
  quantite: number;
  unite: string;
  prixUnitaireHt: number;
  tvaTaux: string;
}

interface DevisDetail {
  id: string;
  numero: string;
  statut: string;
  clientNom: string;
  clientEmail?: string;
  clientTelephone?: string;
  clientAdresse?: string;
  chantierAdresse?: string;
  dateEmission: string;
  dateValidite: string;
  lignes: Ligne[];
  totalHt: number;
  tvaMontant: number;
  totalTtc: number;
  acomptePourcentage: number;
  conditionsPaiement?: string;
  notes?: string;
  mentionDechets?: string;
}

const STATUT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  brouillon: { bg: "bg-[#e8e8e2]", text: "text-[#666660]", label: "Brouillon" },
  envoye:    { bg: "bg-[#dce8f0]", text: "text-[#2563eb]", label: "Envoyé" },
  signe:     { bg: "bg-[#dcf0e4]", text: "text-[#4a7c59]", label: "Signé" },
  refuse:    { bg: "bg-[#f0dcdc]", text: "text-[#c04040]", label: "Refusé" },
};

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

export default function DevisDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [devis, setDevis] = useState<DevisDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [signeModal, setSigneModal] = useState<{
    nomChantier: string;
    adresse: string;
    dateDebut: string;
    dateFin: string;
    saving: boolean;
  } | null>(null);

  const fetchDevis = useCallback(async () => {
    try {
      const res = await fetch(`/api/devis/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDevis(data);
      }
    } catch (e) {
      console.error("Erreur chargement devis:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDevis(); }, [fetchDevis]);

  const tvaParTaux = useMemo(() => {
    if (!devis) return {};
    const map: Record<string, number> = {};
    for (const l of devis.lignes) {
      if (l.tvaTaux === "exempt") continue;
      const ht = (l.quantite || 0) * (l.prixUnitaireHt || 0);
      const tva = ht * ((parseFloat(l.tvaTaux) || 0) / 100);
      map[l.tvaTaux] = (map[l.tvaTaux] || 0) + tva;
    }
    return map;
  }, [devis]);

  const handleDownload = async () => {
    if (!devis) return;
    setActionLoading("download");
    try {
      const res = await fetch(`/api/devis/${id}/send?download=true`, { method: "POST" });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${devis.numero}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors du téléchargement");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSend = async () => {
    if (!devis) return;
    setActionLoading("send");
    try {
      const res = await fetch(`/api/devis/${id}/send`, { method: "POST" });
      if (res.ok) {
        await fetchDevis();
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de l'envoi");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  };

  const openSigneModal = () => {
    if (!devis) return;
    const today = new Date().toISOString().slice(0, 10);
    setSigneModal({
      nomChantier: `Chantier - ${devis.clientNom}`,
      adresse: devis.chantierAdresse || "",
      dateDebut: today,
      dateFin: "",
      saving: false,
    });
  };

  const handleSigneAvecChantier = async () => {
    if (!devis || !signeModal) return;
    setSigneModal((s) => s ? { ...s, saving: true } : null);
    try {
      // 1. Marquer le devis comme signé
      const patchRes = await fetch(`/api/devis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "signe" }),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json();
        alert(err.error || "Erreur mise à jour statut");
        return;
      }

      // 2. Créer le client si un email est disponible
      let clientId: string | null = null;
      if (devis.clientEmail) {
        try {
          const clientRes = await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nom: devis.clientNom,
              email: devis.clientEmail,
              telephone: devis.clientTelephone || null,
              adresse: devis.clientAdresse || null,
            }),
          });
          if (clientRes.ok) {
            const client = await clientRes.json();
            clientId = client.id;
          }
        } catch {}
      }

      // 3. Créer le chantier
      const chantierRes = await fetch("/api/chantiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: signeModal.nomChantier,
          adresse: signeModal.adresse || null,
          dateDebut: signeModal.dateDebut || null,
          dateFin: signeModal.dateFin || null,
          statut: "EN_COURS",
          clientId,
        }),
      });

      if (chantierRes.ok) {
        const chantier = await chantierRes.json();
        setSigneModal(null);
        router.push(`/admin/chantiers/${chantier.id}`);
      } else {
        const err = await chantierRes.json();
        alert(err.error || "Erreur création chantier");
        await fetchDevis();
        setSigneModal(null);
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setSigneModal((s) => s ? { ...s, saving: false } : null);
    }
  };

  const handleSigneSansChaniter = async () => {
    setSigneModal(null);
    await handleStatut("signe");
  };

  const handleStatut = async (statut: string) => {
    if (!devis) return;
    setActionLoading(statut);
    try {
      const res = await fetch(`/api/devis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      if (res.ok) {
        await fetchDevis();
      } else {
        const err = await res.json();
        alert(err.error || "Erreur");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#f0f0eb] animate-pulse" />
          <div className="h-7 w-48 rounded bg-[#f0f0eb] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="btp-card p-6 animate-pulse space-y-3">
                <div className="h-5 w-32 rounded bg-[#f0f0eb]" />
                <div className="h-4 w-3/4 rounded bg-[#f0f0eb]" />
                <div className="h-4 w-1/2 rounded bg-[#f0f0eb]" />
              </div>
            ))}
          </div>
          <div className="btp-card p-5 animate-pulse h-48" />
        </div>
      </div>
    );
  }

  if (!devis) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="btp-btn-secondary flex items-center gap-2 px-3 py-2 text-sm">
          <ChevronLeft className="h-4 w-4" /> Retour
        </button>
        <div className="btp-card p-12 text-center">
          <p className="text-muted-foreground">Devis introuvable.</p>
        </div>
      </div>
    );
  }

  const style = STATUT_STYLE[devis.statut] || STATUT_STYLE.brouillon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/devis")}
            className="btp-btn-secondary p-2 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{devis.numero}</h1>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                {style.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Émis le {fmtDate(devis.dateEmission)} · Valable jusqu&apos;au {fmtDate(devis.dateValidite)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">

          {/* Client */}
          <div className="btp-card p-6 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Client</h2>
            <p className="text-lg font-semibold text-foreground">{devis.clientNom}</p>
            <div className="space-y-1.5">
              {devis.clientEmail && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{devis.clientEmail}</span>
                </div>
              )}
              {devis.clientTelephone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{devis.clientTelephone}</span>
                </div>
              )}
              {devis.clientAdresse && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{devis.clientAdresse}</span>
                </div>
              )}
            </div>
          </div>

          {/* Chantier + Dates */}
          {(devis.chantierAdresse || devis.dateEmission) && (
            <div className="btp-card p-6 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Chantier</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {devis.chantierAdresse && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <span className="text-foreground">{devis.chantierAdresse}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Émission :</span>
                    <span className="text-foreground font-medium">{fmtDate(devis.dateEmission)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Validité :</span>
                    <span className="text-foreground font-medium">{fmtDate(devis.dateValidite)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tableau prestations */}
          <div className="btp-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Prestations</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0f0eb]">
                    <th className="text-left pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider pr-2">Description</th>
                    <th className="text-center pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-14">Qté</th>
                    <th className="text-center pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-16">Unité</th>
                    <th className="text-right pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-24">Prix HT</th>
                    <th className="text-center pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-16">TVA</th>
                    <th className="text-right pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-24">Total TTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0eb]">
                  {devis.lignes.map((l, i) => {
                    const ht = (l.quantite || 0) * (l.prixUnitaireHt || 0);
                    const tvaRate = l.tvaTaux === "exempt" ? 0 : parseFloat(l.tvaTaux) || 0;
                    const ttc = ht * (1 + tvaRate / 100);
                    return (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#fafaf8]" : ""}>
                        <td className="py-3 pr-2 text-foreground">{l.description || "—"}</td>
                        <td className="py-3 text-center text-muted-foreground">{l.quantite}</td>
                        <td className="py-3 text-center text-muted-foreground">{l.unite}</td>
                        <td className="py-3 text-right text-muted-foreground">{formatMoney(l.prixUnitaireHt)}</td>
                        <td className="py-3 text-center text-muted-foreground">
                          {l.tvaTaux === "exempt" ? "Exo." : `${l.tvaTaux}%`}
                        </td>
                        <td className="py-3 text-right font-medium text-foreground">{formatMoney(ttc)}</td>
                      </tr>
                    );
                  })}
                  {devis.lignes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground text-sm">Aucune prestation</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conditions */}
          {(devis.conditionsPaiement || devis.notes || devis.mentionDechets) && (
            <div className="btp-card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Conditions</h2>
              {devis.conditionsPaiement && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Paiement</p>
                  <p className="text-sm text-foreground">{devis.conditionsPaiement}</p>
                </div>
              )}
              {devis.mentionDechets && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Gestion des déchets</p>
                  <p className="text-sm text-foreground">{devis.mentionDechets}</p>
                </div>
              )}
              {devis.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-foreground">{devis.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Colonne sticky — Récap + Actions */}
        <div className="space-y-4">
          {/* Totaux */}
          <div className="btp-card p-5 space-y-3 lg:sticky lg:top-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Récapitulatif</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total HT</span>
                <span className="font-medium">{formatMoney(devis.totalHt)}</span>
              </div>
              {Object.entries(tvaParTaux).map(([taux, montant]) => (
                <div key={taux} className="flex justify-between">
                  <span className="text-muted-foreground">TVA {taux}%</span>
                  <span className="font-medium">{formatMoney(montant)}</span>
                </div>
              ))}
              <div className="border-t border-[#f0f0eb] pt-2 flex justify-between">
                <span className="font-semibold text-foreground">Total TTC</span>
                <span className="font-bold text-lg text-[var(--primary)]">{formatMoney(devis.totalTtc)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Acompte {devis.acomptePourcentage}%</span>
                <span className="font-medium">{formatMoney(devis.totalTtc * (devis.acomptePourcentage / 100))}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-[#f0f0eb] pt-4 space-y-2">
              {/* Télécharger PDF — disponible pour tous les statuts */}
              <button
                onClick={handleDownload}
                disabled={actionLoading !== null}
                className="btp-btn-secondary w-full flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-sm border border-border"
              >
                {actionLoading === "download"
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Génération...</>
                  : <><Download className="h-4 w-4" /> Télécharger PDF</>}
              </button>

              {devis.statut === "brouillon" && (
                <>
                  <button
                    onClick={() => router.push(`/admin/devis/${id}/modifier`)}
                    className="btp-btn-secondary w-full flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-sm border border-border"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={actionLoading !== null}
                    className="btp-btn-primary w-full flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-sm"
                  >
                    {actionLoading === "send"
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</>
                      : <><Send className="h-4 w-4" /> Envoyer par email</>}
                  </button>
                </>
              )}
              {devis.statut === "envoye" && (
                <>
                  <button
                    onClick={handleSend}
                    disabled={actionLoading !== null}
                    className="btp-btn-primary w-full flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-sm"
                  >
                    {actionLoading === "send"
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</>
                      : <><Send className="h-4 w-4" /> Renvoyer par email</>}
                  </button>
                  <button
                    onClick={openSigneModal}
                    disabled={actionLoading !== null}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-[10px] bg-[#dcf0e4] text-[#4a7c59] hover:brightness-95 transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Marquer comme signé
                  </button>
                  <button
                    onClick={() => handleStatut("refuse")}
                    disabled={actionLoading !== null}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-[10px] bg-[#f0dcdc] text-[#c04040] hover:brightness-95 transition-all"
                  >
                    {actionLoading === "refuse"
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Mise à jour...</>
                      : <><XCircle className="h-4 w-4" /> Marquer comme refusé</>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal — Devis signé : créer un chantier ? */}
      {signeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-content-center rounded-full bg-[#dcf0e4]">
                  <CheckCircle2 className="h-5 w-5 text-[#4a7c59]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Devis signé !</h3>
                  <p className="text-xs text-muted-foreground">Voulez-vous créer le chantier maintenant ?</p>
                </div>
              </div>
              <button onClick={() => setSigneModal(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[13px] font-medium text-muted-foreground mb-1">Nom du chantier</label>
                <input
                  value={signeModal.nomChantier}
                  onChange={(e) => setSigneModal((s) => s ? { ...s, nomChantier: e.target.value } : null)}
                  className="btp-input px-3 py-2 text-sm w-full"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-muted-foreground mb-1">Adresse du chantier</label>
                <input
                  value={signeModal.adresse}
                  onChange={(e) => setSigneModal((s) => s ? { ...s, adresse: e.target.value } : null)}
                  className="btp-input px-3 py-2 text-sm w-full"
                  placeholder="Adresse complète"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-muted-foreground mb-1">Date de début</label>
                  <input
                    type="date"
                    value={signeModal.dateDebut}
                    onChange={(e) => setSigneModal((s) => s ? { ...s, dateDebut: e.target.value } : null)}
                    className="btp-input px-3 py-2 text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-muted-foreground mb-1">Date de fin (optionnel)</label>
                  <input
                    type="date"
                    value={signeModal.dateFin}
                    onChange={(e) => setSigneModal((s) => s ? { ...s, dateFin: e.target.value } : null)}
                    className="btp-input px-3 py-2 text-sm w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSigneSansChaniter}
                disabled={signeModal.saving}
                className="flex-1 py-2.5 rounded-[10px] border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Ignorer
              </button>
              <button
                onClick={handleSigneAvecChantier}
                disabled={signeModal.saving || !signeModal.nomChantier.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-[#4a7c59] hover:bg-[#3d6a4a] disabled:bg-[#a0bfaa] text-white font-semibold text-sm transition-colors"
              >
                {signeModal.saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Création...</>
                  : <><HardHat className="h-4 w-4" /> Créer le chantier</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
