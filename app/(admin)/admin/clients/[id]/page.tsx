"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false }
) as any;
import Breadcrumb from "@/components/breadcrumb";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
  HardHat,
  Sparkles,
  Users,
  BarChart3,
  Plus,
  Loader2,
  ExternalLink,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { formatMoney, formatDate } from "@/lib/utils";

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  PROSPECT: { label: "Prospect", color: "bg-blue-50 text-blue-600" },
  DEVIS_ENVOYE: { label: "Devis envoyé", color: "bg-amber-50 text-amber-600" },
  EN_COURS: { label: "En cours", color: "bg-green-50 text-green-600" },
  TERMINE: { label: "Terminé", color: "bg-gray-100 text-gray-500" },
  ANNULE: { label: "Annulé", color: "bg-red-50 text-red-500" },
};

const COLONNE_LABELS: Record<string, string> = {
  TOUS_PROSPECTS: "Tous prospects",
  ENVOI_DEVIS: "Envoi devis",
  RELANCE_1: "Relance 1",
  RELANCE_2: "Relance 2",
  RELANCE_3: "Relance 3",
  GAGNE: "Gagné",
  PERDU: "Perdu",
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: "", prenom: "", email: "", telephone: "", adresse: "", entreprise: "", typeClient: "PARTICULIER",
  });

  const startEdit = () => {
    setEditForm({
      nom: client.nom || "",
      prenom: client.prenom || "",
      email: client.email || "",
      telephone: client.telephone || "",
      adresse: client.adresse || "",
      entreprise: client.entreprise || "",
      typeClient: client.typeClient || "PARTICULIER",
    });
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: client.id, ...editForm }),
      });
      if (res.ok) {
        const updated = await res.json();
        setClient((prev: any) => ({ ...prev, ...updated }));
        setIsEditing(false);
      }
    } catch {}
    setSaving(false);
  };

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/clients?id=${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setClient(data);
      } catch {
        router.push("/admin/clients");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchClient();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f59e0b]" />
      </div>
    );
  }

  if (!client) return null;

  const totalDepenses = client.chantiers?.reduce(
    (sum: number, ch: any) => sum + ch.depenses.reduce((s: number, d: any) => s + d.montant, 0),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Clients", href: "/admin/clients" },
        { label: `${client.nom} ${client.prenom || ""}`.trim() },
      ]} />

      <button
        onClick={() => router.push("/admin/clients")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux clients
      </button>

      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-content-center rounded-xl bg-[#4a7c59]/10">
              {(isEditing ? editForm.typeClient : client.typeClient) === "ENTREPRISE" ? (
                <Building2 className="h-7 w-7 text-[#4a7c59]" />
              ) : (
                <User className="h-7 w-7 text-[#4a7c59]" />
              )}
            </div>
            <div>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={editForm.nom}
                      onChange={(e) => setEditForm((f) => ({ ...f, nom: e.target.value }))}
                      placeholder="Nom *"
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 w-32"
                    />
                    <input
                      value={editForm.prenom}
                      onChange={(e) => setEditForm((f) => ({ ...f, prenom: e.target.value }))}
                      placeholder="Prénom"
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 w-32"
                    />
                  </div>
                  <input
                    value={editForm.entreprise}
                    onChange={(e) => setEditForm((f) => ({ ...f, entreprise: e.target.value }))}
                    placeholder="Entreprise (optionnel)"
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 w-full"
                  />
                  <select
                    value={editForm.typeClient}
                    onChange={(e) => setEditForm((f) => ({ ...f, typeClient: e.target.value }))}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                  >
                    <option value="PARTICULIER">Particulier</option>
                    <option value="ENTREPRISE">Entreprise</option>
                  </select>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {client.nom} {client.prenom || ""}
                  </h1>
                  {client.entreprise && (
                    <p className="text-sm text-gray-500">{client.entreprise}</p>
                  )}
                  <span className="mt-1 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {client.typeClient === "ENTREPRISE" ? "Entreprise" : "Particulier"}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isEditing ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <X className="h-4 w-4" /> Annuler
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving || !editForm.nom}
                  className="flex items-center gap-2 rounded-lg bg-[#4a7c59] hover:bg-[#3d6a4a] disabled:bg-gray-200 px-4 py-2 text-sm font-semibold text-white transition-colors"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Enregistrer
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startEdit}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors shadow-sm"
                >
                  <Pencil className="h-4 w-4" /> Modifier
                </button>
                <button
                  onClick={() => router.push(`/admin/chantiers/nouveau?clientId=${client.id}`)}
                  className="flex items-center gap-2 rounded-lg bg-[#f59e0b] px-4 py-2 text-sm font-semibold text-black shadow-sm hover:bg-[#e8960a] transition-colors"
                >
                  <Plus className="h-4 w-4" /> Nouveau chantier
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isEditing ? (
            <>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Email"
                  className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  value={editForm.telephone}
                  onChange={(e) => setEditForm((f) => ({ ...f, telephone: e.target.value }))}
                  placeholder="Téléphone"
                  className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  value={editForm.adresse}
                  onChange={(e) => setEditForm((f) => ({ ...f, adresse: e.target.value }))}
                  placeholder="Adresse"
                  className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                />
              </div>
            </>
          ) : (
            <>
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {client.email}
                </div>
              )}
              {client.telephone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {client.telephone}
                </div>
              )}
              {client.adresse && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {client.adresse}
                </div>
              )}
            </>
          )}
        </div>
      </MotionDiv>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={HardHat} label="Chantiers" value={client.chantiers?.length || 0} />
        <KpiCard icon={BarChart3} label="CA total" value={formatMoney(client.caTotal || 0)} amber />
        <KpiCard icon={Sparkles} label="Estimations" value={client.chantiers?.reduce((s: number, ch: any) => s + (ch.estimations?.length || 0), 0) || 0} />
        <KpiCard icon={Users} label="CRM" value={client.prospects?.length || 0} sub="prospects liés" />
      </div>

      {/* Chantiers */}
      <Section title="Chantiers" icon={HardHat} count={client.chantiers?.length}>
        {client.chantiers?.length > 0 ? (
          <div className="space-y-3">
            {client.chantiers.map((ch: any) => {
              const s = STATUT_LABELS[ch.statut] || STATUT_LABELS.PROSPECT;
              const budget = ch.depenses.reduce((sum: number, d: any) => sum + d.montant, 0);
              return (
                <div
                  key={ch.id}
                  onClick={() => router.push(`/admin/chantiers/${ch.id}`)}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:bg-gray-50 hover:-translate-y-[3px] hover:scale-[1.01] hover:shadow-lg transition-[transform,box-shadow,background-color] duration-200 ease-in-out"
                >
                  <div>
                    <p className="font-medium text-gray-900">{ch.nom}</p>
                    <p className="text-xs text-gray-500">{ch.adresse}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[#f59e0b]">{formatMoney(budget)}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}>
                      {s.label}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucun chantier pour ce client</p>
        )}
      </Section>

      {/* Estimations */}
      <Section title="Estimations" icon={Sparkles} count={
        client.chantiers?.reduce((s: number, ch: any) => s + (ch.estimations?.length || 0), 0) || 0
      }>
        {client.chantiers?.some((ch: any) => ch.estimations?.length > 0) ? (
          <div className="space-y-3">
            {client.chantiers.flatMap((ch: any) =>
              (ch.estimations || []).map((est: any) => {
                const couts = est.resultatsJson?.couts;
                return (
                  <div key={est.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                    <div>
                      <p className="font-medium text-gray-900">Estimation pour {ch.nom}</p>
                      <p className="text-xs text-gray-500">{formatDate(est.createdAt)}</p>
                    </div>
                    {couts?.total_ttc && (
                      <span className="text-sm font-semibold text-[#f59e0b]">{formatMoney(couts.total_ttc)}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucune estimation</p>
        )}
      </Section>

      {/* CRM */}
      <Section title="Position CRM" icon={Users} count={client.prospects?.length}>
        {client.prospects?.length > 0 ? (
          <div className="space-y-3">
            {client.prospects.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                <div>
                  <p className="font-medium text-gray-900">{p.nom}</p>
                  <p className="text-xs text-gray-500">
                    {p.actions?.[0] ? `Dernière action: ${p.actions[0].contenu}` : "Aucune action"}
                  </p>
                </div>
                <span className="rounded-full bg-[#f59e0b]/10 px-2.5 py-0.5 text-xs font-medium text-[#f59e0b]">
                  {COLONNE_LABELS[p.colonne] || p.colonne}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucun prospect lié</p>
        )}
      </Section>

      {/* Financier */}
      <Section title="Bilan financier" icon={BarChart3}>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">CA total</p>
            <p className="mt-1 text-2xl font-bold text-[#f59e0b]">{formatMoney(client.caTotal || 0)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total dépenses</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatMoney(totalDepenses)}</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, amber }: {
  icon: any; label: string; value: string | number; sub?: string; amber?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${amber ? "text-[#f59e0b]" : "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function Section({ title, icon: Icon, count, children }: {
  title: string; icon: any; count?: number; children: React.ReactNode;
}) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-[#4a7c59]" />
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">{count}</span>
        )}
      </div>
      {children}
    </MotionDiv>
  );
}
