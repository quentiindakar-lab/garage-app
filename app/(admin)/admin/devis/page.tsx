"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Calendar, Euro } from "lucide-react";
import { formatMoney } from "@/lib/utils";

interface Devis {
  id: string;
  numero: string;
  statut: string;
  clientNom: string;
  clientEmail?: string;
  totalTtc: number;
  dateEmission: string;
  dateValidite: string;
  createdAt: string;
}

const STATUT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  brouillon: { bg: "bg-[#e8e8e2]", text: "text-[#666660]", label: "Brouillon" },
  envoye:    { bg: "bg-[#dce8f0]", text: "text-[#2563eb]", label: "Envoyé" },
  signe:     { bg: "bg-[#dcf0e4]", text: "text-[#4a7c59]", label: "Signé" },
  refuse:    { bg: "bg-[#f0dcdc]", text: "text-[#c04040]", label: "Refusé" },
};

export default function DevisPage() {
  const router = useRouter();
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevis = useCallback(async () => {
    try {
      const res = await fetch("/api/devis");
      if (res.ok) {
        const data = await res.json();
        setDevis(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Erreur chargement devis:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDevis(); }, [fetchDevis]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Devis</h1>
            <p className="text-muted-foreground mt-1">Chargement…</p>
          </div>
        </div>
        <div className="btp-card overflow-hidden">
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-4 w-28 rounded bg-[#f0f0eb]" />
                <div className="h-4 w-36 rounded bg-[#f0f0eb] flex-1" />
                <div className="h-4 w-20 rounded bg-[#f0f0eb]" />
                <div className="h-4 w-20 rounded bg-[#f0f0eb]" />
                <div className="h-4 w-24 rounded bg-[#f0f0eb]" />
                <div className="h-6 w-16 rounded-full bg-[#f0f0eb]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Devis</h1>
          <p className="text-muted-foreground mt-1">{devis.length} devis au total</p>
        </div>
        <button
          onClick={() => router.push("/admin/devis/nouveau")}
          className="btp-btn-primary flex items-center gap-2 px-4 py-2.5 font-semibold text-sm hover:-translate-y-[2px] hover:shadow-md transition-[transform,box-shadow] duration-200 ease-in-out"
        >
          <Plus className="h-4 w-4" />
          Nouveau devis
        </button>
      </div>

      {devis.length === 0 ? (
        <div className="btp-card p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Aucun devis créé</p>
          <p className="text-sm text-muted-foreground/70 mt-1">{'Créez votre premier devis en cliquant sur "+ Nouveau devis"'}</p>
        </div>
      ) : (
        <div className="btp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f0f0eb]">
                  <th className="text-left pb-3 pt-4 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Numéro</th>
                  <th className="text-left pb-3 pt-4 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                  <th className="text-left pb-3 pt-4 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Date émission</th>
                  <th className="text-left pb-3 pt-4 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Validité</th>
                  <th className="text-right pb-3 pt-4 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Montant TTC</th>
                  <th className="text-center pb-3 pt-4 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0eb]">
                {devis.map((d) => {
                  const style = STATUT_STYLE[d.statut] || STATUT_STYLE.brouillon;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => router.push(`/admin/devis/${d.id}`)}
                      className="hover:bg-[#fafaf8] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-medium text-foreground">{d.numero}</td>
                      <td className="py-3 px-4 text-foreground">{d.clientNom}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(d.dateEmission).toLocaleDateString("fr-FR")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(d.dateValidite).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">
                        <span className="inline-flex items-center gap-1 justify-end">
                          <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatMoney(d.totalTtc)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
