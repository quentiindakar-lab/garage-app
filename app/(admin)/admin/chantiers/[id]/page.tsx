"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { BTP_CONFIG } from "@/config/btp.config";
import Breadcrumb from "@/components/breadcrumb";
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  HardHat,
  User,
  Camera,
  Upload,
  Edit2,
  Trash2,
  Save,
  Loader2,
  Sparkles,
  Users,
  Plus,
  CheckCircle2,
  FileText,
  Clock,
  Ruler,
  ExternalLink,
  BarChart3,
  UserCheck,
} from "lucide-react";
import { formatMoney } from "@/lib/utils";

interface Chantier {
  id: string;
  nom: string;
  adresse: string;
  type?: string | null;
  surface?: number | null;
  materiaux?: string | null;
  description?: string | null;
  statut: string;
  dateDebut?: string | null;
  dateFin?: string | null;
  notes?: string | null;
  chef?: { id: string; nom: string; prenom?: string | null } | null;
  client?: { id: string; nom: string; prenom?: string | null; email?: string | null; telephone?: string | null } | null;
  estimations?: { id: string; resultatsJson: any; createdAt: string }[];
  affectations?: { id: string; membre: { id: string; nom: string; prenom?: string | null; role: string } }[];
  photos?: { id: string; url: string; description?: string | null; uploadedAt: string }[];
  _count?: { photos: number };
}

const STATUT_OPTIONS = [
  { value: "PROSPECT", label: "En attente", color: "bg-amber-500/10 text-amber-400" },
  { value: "DEVIS_ENVOYE", label: "Devis envoyé", color: "bg-purple-500/10 text-purple-400" },
  { value: "EN_COURS", label: "En cours", color: "bg-emerald-500/10 text-emerald-400" },
  { value: "TERMINE", label: "Terminé", color: "bg-blue-500/10 text-blue-400" },
  { value: "ANNULE", label: "Annulé", color: "bg-red-500/10 text-red-400" },
];

export default function ChantierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Chantier>>({});
  const [depenses, setDepenses] = useState<any[]>([]);
  const [totalDepenses, setTotalDepenses] = useState(0);

  const fetchChantier = useCallback(async () => {
    try {
      const res = await fetch(`/api/chantiers?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        const found = Array.isArray(data)
          ? data.find((c: Chantier) => c.id === id)
          : data;
        if (found) setChantier(found);
      }
    } catch {
      setChantier({
        id,
        nom: "Rénovation cuisine",
        adresse: "12 rue Victor Hugo, Pau",
        type: "Multi-corps",
        surface: 25,
        materiaux: "Carrelage, placo, peinture",
        description: "Rénovation complète de la cuisine avec pose de carrelage, faux plafond et peinture.",
        statut: "EN_COURS",
        dateDebut: "2026-03-10",
        dateFin: "2026-03-24",
        notes: "Client demande finition haut de gamme",
        chef: { id: "1", nom: "Dupont", prenom: "Marc" },
        affectations: [
          { id: "a1", membre: { id: "1", nom: "Dupont", prenom: "Marc", role: "Chef de chantier" } },
          { id: "a2", membre: { id: "3", nom: "Petit", prenom: "Thomas", role: "Ouvrier" } },
        ],
        photos: [],
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchDepenses = useCallback(async () => {
    try {
      const res = await fetch(`/api/depenses?chantierId=${id}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setDepenses(list);
        setTotalDepenses(list.reduce((s: number, d: any) => s + d.montant, 0));
      }
    } catch {}
  }, [id]);

  useEffect(() => { fetchChantier(); fetchDepenses(); }, [fetchChantier, fetchDepenses]);

  const startEdit = () => {
    if (!chantier) return;
    setEditForm({
      nom: chantier.nom,
      adresse: chantier.adresse,
      type: chantier.type,
      surface: chantier.surface,
      materiaux: chantier.materiaux,
      description: chantier.description,
      statut: chantier.statut,
      dateDebut: chantier.dateDebut,
      dateFin: chantier.dateFin,
      notes: chantier.notes,
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/chantiers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...editForm,
          surface: editForm.surface ? parseFloat(String(editForm.surface)) : null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setChantier((prev) => prev ? { ...prev, ...updated } : prev);
      }
    } catch {}
    setSaving(false);
    setEditing(false);
  };

  const deleteChantier = async () => {
    if (!confirm("Supprimer ce chantier ?")) return;
    try {
      await fetch(`/api/chantiers?id=${id}`, { method: "DELETE" });
    } catch {}
    router.push("/admin/chantiers");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!chantier) {
    return (
      <div className="text-center py-16">
        <HardHat className="h-12 w-12 text-slate-700 mx-auto mb-3" />
        <p className="text-slate-500">Chantier introuvable</p>
        <button onClick={() => router.push("/admin/chantiers")} className="mt-4 text-amber-400 text-sm hover:underline">
          Retour aux chantiers
        </button>
      </div>
    );
  }

  const statutInfo = STATUT_OPTIONS.find((s) => s.value === chantier.statut) || STATUT_OPTIONS[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Breadcrumb items={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Chantiers", href: "/admin/chantiers" },
        { label: chantier.nom },
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/chantiers")}
            className="p-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{chantier.nom}</h1>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
              <MapPin className="h-3.5 w-3.5" /> {chantier.adresse}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/admin/estimation?chantier=${id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-sm font-medium transition-colors">
            <Sparkles className="h-4 w-4" /> Estimation IA
          </button>
          {editing ? (
            <>
              <button onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-sm text-slate-400 hover:text-white transition-colors">
                Annuler
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm transition-colors">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
              </button>
            </>
          ) : (
            <>
              <button onClick={startEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-sm text-slate-300 hover:text-white transition-colors">
                <Edit2 className="h-4 w-4" /> Modifier
              </button>
              <button onClick={deleteChantier}
                className="p-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-red-400 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-400" /> Informations
            </h2>
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <EditField label="Nom" value={editForm.nom || ""} onChange={(v) => setEditForm({ ...editForm, nom: v })} />
                  <EditField label="Adresse" value={editForm.adresse || ""} onChange={(v) => setEditForm({ ...editForm, adresse: v })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                    <select value={editForm.type || ""} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                      <option value="">—</option>
                      {BTP_CONFIG.metiers.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <EditField label="Surface (m²)" type="number" value={String(editForm.surface || "")} onChange={(v) => setEditForm({ ...editForm, surface: v ? parseFloat(v) : null })} />
                  <EditField label="Matériaux" value={editForm.materiaux || ""} onChange={(v) => setEditForm({ ...editForm, materiaux: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <EditField label="Date début" type="date" value={editForm.dateDebut?.slice(0, 10) || ""} onChange={(v) => setEditForm({ ...editForm, dateDebut: v })} />
                  <EditField label="Date fin" type="date" value={editForm.dateFin?.slice(0, 10) || ""} onChange={(v) => setEditForm({ ...editForm, dateFin: v })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Statut</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUT_OPTIONS.map((s) => (
                      <button key={s.value} type="button" onClick={() => setEditForm({ ...editForm, statut: s.value })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${editForm.statut === s.value ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <textarea rows={3} value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                  <textarea rows={2} value={editForm.notes || ""} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <InfoRow icon={HardHat} label="Type" value={chantier.type || "—"} />
                <InfoRow icon={Ruler} label="Surface" value={chantier.surface ? `${chantier.surface} m²` : "—"} />
                <InfoRow icon={CalendarDays} label="Début" value={chantier.dateDebut ? new Date(chantier.dateDebut).toLocaleDateString("fr-FR") : "—"} />
                <InfoRow icon={CalendarDays} label="Fin" value={chantier.dateFin ? new Date(chantier.dateFin).toLocaleDateString("fr-FR") : "—"} />
                <InfoRow icon={CheckCircle2} label="Matériaux" value={chantier.materiaux || "—"} />
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">Statut</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statutInfo.color}`}>
                      {statutInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {!editing && chantier.description && (
              <div className="pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400">{chantier.description}</p>
              </div>
            )}
            {!editing && chantier.notes && (
              <div className="pt-2">
                <p className="text-xs text-slate-500 italic">Note : {chantier.notes}</p>
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Camera className="h-4 w-4 text-amber-400" /> Photos
              </h2>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer">
                <Upload className="h-3.5 w-3.5" /> Ajouter
                <input type="file" accept="image/*" multiple className="hidden" />
              </label>
            </div>
            {chantier.photos && chantier.photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {chantier.photos.map((p) => (
                  <div key={p.id} className="aspect-square rounded-lg overflow-hidden border border-slate-700">
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-600">Aucune photo pour ce chantier</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Chef */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-amber-400" /> Chef de chantier
            </h3>
            {chantier.chef ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-400">
                  {(chantier.chef.prenom?.[0] || "")}{chantier.chef.nom[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{chantier.chef.prenom} {chantier.chef.nom}</p>
                  <p className="text-xs text-slate-500">Chef de chantier</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Non assigné</p>
            )}
          </div>

          {/* Membres */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-400" /> Équipe ({chantier.affectations?.length || 0})
              </h3>
              <button className="text-xs text-amber-400 hover:text-amber-300">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {chantier.affectations && chantier.affectations.length > 0 ? (
              <div className="space-y-2">
                {chantier.affectations.map((a) => {
                  const hue = (a.membre.nom + (a.membre.prenom || "")).split("").reduce((s, c) => s + c.charCodeAt(0), 0) % 360;
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-1">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: `hsl(${hue}, 55%, 40%)` }}>
                        {(a.membre.prenom?.[0] || "")}{a.membre.nom[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{a.membre.prenom} {a.membre.nom}</p>
                        <p className="text-[11px] text-slate-500">{a.membre.role}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aucun membre affecté</p>
            )}
          </div>

          {/* Client associé */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-amber-400" /> Client
            </h3>
            {chantier.client ? (
              <div
                onClick={() => router.push(`/admin/clients/${chantier.client!.id}`)}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-3 cursor-pointer hover:border-amber-500/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-white">{chantier.client.nom} {chantier.client.prenom || ""}</p>
                  {chantier.client.email && <p className="text-xs text-slate-400">{chantier.client.email}</p>}
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aucun client associé</p>
            )}
          </div>

          {/* Dépenses */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-400" /> Dépenses
              </h3>
              <button onClick={() => router.push(`/admin/bilan?chantierId=${id}`)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                Voir tout <ExternalLink className="h-3 w-3" />
              </button>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-xs text-slate-400">Total dépenses</p>
              <p className="text-lg font-bold text-white">{formatMoney(totalDepenses)}</p>
              <p className="text-xs text-slate-500 mt-1">{depenses.length} dépense{depenses.length > 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Estimations */}
          {chantier.estimations && chantier.estimations.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" /> Estimations ({chantier.estimations.length})
              </h3>
              {chantier.estimations.map((est) => {
                const couts = est.resultatsJson?.couts;
                return (
                  <div key={est.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                    <p className="text-xs text-slate-400">{new Date(est.createdAt).toLocaleDateString("fr-FR")}</p>
                    {couts?.total_ttc && <p className="text-sm font-semibold text-amber-400">{formatMoney(couts.total_ttc)}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick actions */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-2">
            <h3 className="text-sm font-semibold text-white mb-2">Actions rapides</h3>
            <button onClick={() => router.push(`/admin/estimation?chantier=${id}`)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-left">
              <Sparkles className="h-4 w-4 text-amber-400" /> Lancer estimation IA
            </button>
            <button onClick={() => router.push(`/admin/planning?chantier=${id}`)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-left">
              <CalendarDays className="h-4 w-4 text-blue-400" /> Voir dans le planning
            </button>
            <button onClick={() => router.push(`/admin/bilan?chantierId=${id}`)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-left">
              <FileText className="h-4 w-4 text-emerald-400" /> Dépenses du chantier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof HardHat; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
      <div>
        <p className="text-slate-500 text-xs">{label}</p>
        <p className="text-white font-medium">{value}</p>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
    </div>
  );
}
