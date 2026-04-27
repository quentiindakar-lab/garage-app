"use client";

import { useState, useCallback, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Mail,
  Phone,
  Loader2,
  Send,
  X,
  CheckCircle2,
  XCircle,
  GripVertical,
  HardHat,
  UserCheck,
  FileText,
} from "lucide-react";

interface Prospect {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  typeChantier: string;
  notes: string;
  colonne: string;
  clientId?: string | null;
  client?: { id: string; nom: string; prenom?: string } | null;
  createdAt: string;
}

const COLUMNS = [
  { id: "TOUS_PROSPECTS", label: "Nouveau / À contacter", color: "border-gray-400" },
  { id: "ENVOI_DEVIS", label: "Envoi du devis", color: "border-blue-500" },
  { id: "RELANCE_1", label: "Relance 1", color: "border-amber-500" },
  { id: "RELANCE_2", label: "Relance 2", color: "border-orange-500" },
  { id: "RELANCE_3", label: "Relance 3", color: "border-red-500" },
  { id: "GAGNE", label: "Gagné", color: "border-emerald-500" },
  { id: "PERDU", label: "Perdu", color: "border-red-800" },
];

const COLUMN_ICONS: Record<string, typeof CheckCircle2> = {
  GAGNE: CheckCircle2,
  PERDU: XCircle,
};

const KANBAN_MIN_WIDTH_STYLE: React.CSSProperties = { minWidth: COLUMNS.length * 280 };


export default function CrmPage() {
  const router = useRouter();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [popup, setPopup] = useState<{ prospect: Prospect; action: string; message: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [gagnePopup, setGagnePopup] = useState<{ prospect: Prospect; clientId?: string } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchProspects = useCallback(async () => {
    try {
      const res = await fetch("/api/prospects");
      if (!res.ok) {
        console.error("Erreur chargement prospects:", res.status);
        setProspects([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setProspects(data);
      }
    } catch (e) {
      console.error("Erreur réseau prospects:", e);
      setProspects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const prospect = prospects.find((p) => p.id === String(active.id));
    if (!prospect) return;

    let targetColumn = String(over.id);
    if (!COLUMNS.find((c) => c.id === targetColumn)) {
      const overProspect = prospects.find((p) => p.id === String(over.id));
      if (overProspect) targetColumn = overProspect.colonne;
      else return;
    }

    if (prospect.colonne === targetColumn) return;

    const previousColumn = prospect.colonne;
    setProspects((ps) => ps.map((p) => p.id === prospect.id ? { ...p, colonne: targetColumn } : p));

    if (targetColumn === "ENVOI_DEVIS") {
      if (!prospect.email) {
        alert("Ce prospect n'a pas d'email renseigné");
      } else {
        setPopup({
          prospect,
          action: "devis",
          message: `Cher(e) ${prospect.nom},\n\nSuite à votre demande pour des travaux de ${prospect.typeChantier.toLowerCase()}, veuillez trouver ci-joint notre devis détaillé.\n\nNous restons à votre disposition pour toute question.\n\nCordialement,\nBTP Pro`,
        });
      }
    } else if (targetColumn.startsWith("RELANCE_")) {
      const num = targetColumn.split("_")[1];
      if (!prospect.email) {
        alert("Ce prospect n'a pas d'email renseigné");
      } else {
        setPopup({
          prospect,
          action: `relance_${num}`,
          message: `Bonjour ${prospect.nom},\n\nNous souhaitons revenir vers vous concernant notre devis pour vos travaux de ${prospect.typeChantier.toLowerCase()}.\n\nCelui-ci est toujours valable et nous pourrions démarrer rapidement.\n\nN'hésitez pas à nous contacter.\n\nCordialement,\nBTP Pro`,
        });
      }
    }

    try {
      console.log("[PATCH] body:", { id: prospect.id, colonne: targetColumn });
      const res = await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prospect.id, colonne: targetColumn }),
      });
      console.log("[PATCH] status:", res.status);
      if (!res.ok) {
        setProspects((ps) => ps.map((p) => p.id === prospect.id ? { ...p, colonne: previousColumn } : p));
        return;
      }
      if (targetColumn === "GAGNE") {
        const updated = await res.json();
        setProspects((ps) => ps.map((p) => p.id === prospect.id ? { ...p, ...updated } : p));
        setGagnePopup({ prospect: updated, clientId: updated.clientId });
      }
    } catch {
      setProspects((ps) => ps.map((p) => p.id === prospect.id ? { ...p, colonne: previousColumn } : p));
    }
  }, [prospects]);

  const sendEmail = async () => {
    if (!popup) return;
    setSendingEmail(true);
    try {
      await fetch("/api/ai/email-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          to: popup.prospect.email,
          subject: popup.action === "devis" ? "Votre devis BTP Pro" : `Relance — ${popup.prospect.typeChantier}`,
          message: popup.message,
        }),
      });
    } catch {}
    setSendingEmail(false);
    setPopup(null);
  };

  const prospectsSafe = Array.isArray(prospects) ? prospects : [];
  const activeProspect = prospectsSafe.find((p) => p.id === activeId);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM / Pipeline</h1>
          <p className="text-gray-500 mt-1">
            {loading ? "Chargement…" : `${prospectsSafe.length} prospect${prospectsSafe.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push("/admin/crm/emails")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:text-gray-900 transition-colors shadow-sm">
            <Mail className="h-4 w-4" /> Emails IA
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4a7c59] hover:bg-[#3d6a4a] hover:-translate-y-[2px] hover:shadow-md text-white font-semibold text-sm transition-[transform,box-shadow,background-color] duration-200 ease-in-out">
            <Plus className="h-4 w-4" /> Nouveau prospect
          </button>
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4" style={KANBAN_MIN_WIDTH_STYLE}>
            {COLUMNS.map((col) => (
              <div key={col.id} className="w-72 shrink-0 rounded-2xl border border-gray-200 bg-gray-100 p-3 animate-pulse">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300">
                  <div className="h-4 w-28 rounded bg-gray-200" />
                  <div className="ml-auto h-5 w-6 rounded-full bg-gray-200" />
                </div>
                <div className="space-y-2">
                  {[...Array(col.id === "TOUS_PROSPECTS" ? 3 : col.id === "ENVOI_DEVIS" ? 2 : 1)].map((_, j) => (
                    <div key={j} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-24 rounded bg-gray-200" />
                          <div className="h-2.5 w-16 rounded bg-gray-200" />
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="h-2.5 w-32 rounded bg-gray-200" />
                        <div className="h-2.5 w-24 rounded bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4" style={KANBAN_MIN_WIDTH_STYLE}>
            {COLUMNS.map((col) => {
              const colProspects = prospectsSafe.filter((p) => p.colonne === col.id);
              return (
                <DroppableColumn key={col.id} col={col} count={colProspects.length}>
                  <SortableContext items={colProspects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2 min-h-[60px]">
                      {colProspects.map((p) => (
                        <ProspectCard key={p.id} prospect={p} />
                      ))}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeProspect && <ProspectCardUI prospect={activeProspect} isDragging />}
        </DragOverlay>
      </DndContext>
      )}

      {/* Add prospect modal */}
      {showAdd && <AddProspectModal onClose={() => setShowAdd(false)} onAdd={(p) => { setProspects((ps) => [p, ...ps]); setShowAdd(false); }} />}

      {/* Popup Gagné */}
      {gagnePopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-content-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Prospect gagné !</h3>
                <p className="text-sm text-gray-500">{gagnePopup.prospect.nom} est maintenant client</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Souhaitez-vous créer un chantier pour ce nouveau client ?</p>
            <div className="flex gap-3">
              <button onClick={() => setGagnePopup(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Non, plus tard
              </button>
              <button
                onClick={() => {
                  const cId = gagnePopup.clientId || gagnePopup.prospect.clientId;
                  setGagnePopup(null);
                  if (cId) router.push(`/admin/chantiers/nouveau?clientId=${cId}`);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#4a7c59] hover:bg-[#3d6a4a] text-white text-sm font-semibold transition-colors">
                <HardHat className="h-4 w-4" /> Créer un chantier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email popup */}
      {popup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg mx-4 rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {popup.action === "devis" ? "Aperçu du devis" : "Message de relance"}
              </h3>
              <button onClick={() => setPopup(null)} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="text-sm text-gray-500">
              <span className="text-gray-900 font-medium">{popup.prospect.nom}</span> — {popup.prospect.email}
            </div>
            <textarea rows={8} value={popup.message} onChange={(e) => setPopup({ ...popup, message: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30" />
            <div className="flex items-center gap-3">
              <button onClick={() => setPopup(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:text-gray-900 transition-colors">Annuler</button>
              <button onClick={sendEmail} disabled={sendingEmail}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#4a7c59] hover:bg-[#3d6a4a] text-white font-semibold text-sm transition-colors">
                {sendingEmail ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</> : <><Send className="h-4 w-4" /> Envoyer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DroppableColumn = memo(function DroppableColumn({ col, count, children }: { col: typeof COLUMNS[0]; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const Icon = COLUMN_ICONS[col.id];

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 rounded-2xl border bg-gray-100 p-3 transition-colors ${
        isOver ? "border-[#4a7c59]/50 bg-[#4a7c59]/5" : "border-gray-200"
      }`}
    >
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${col.color}`}>
        {Icon && <Icon className={`h-4 w-4 ${col.id === "GAGNE" ? "text-emerald-500" : "text-red-500"}`} />}
        <h3 className="text-sm font-semibold text-gray-900 flex-1">{col.label}</h3>
        <span className="text-xs bg-white text-gray-500 rounded-full px-2 py-0.5 border border-gray-200">{count}</span>
      </div>
      {children}
    </div>
  );
});

const ProspectCard = memo(function ProspectCard({ prospect }: { prospect: Prospect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: prospect.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProspectCardUI prospect={prospect} isDragging={isDragging} />
    </div>
  );
});

function ProspectCardUI({ prospect, isDragging }: { prospect: Prospect; isDragging?: boolean }) {
  const router = useRouter();
  const initials = prospect.nom.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hue = prospect.nom.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm ${isDragging ? "shadow-xl opacity-90 rotate-2 scale-105" : "hover:border-gray-300 hover:-translate-y-[3px] hover:scale-[1.01] hover:shadow-lg"} transition-[transform,box-shadow] duration-200 ease-in-out cursor-grab active:cursor-grabbing`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: `hsl(${hue}, 55%, 45%)` }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{prospect.nom}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <HardHat className="h-3 w-3" /> <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">{prospect.typeChantier}</span>
          </p>
        </div>
        <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="text-[11px] text-gray-500 flex items-center gap-1.5 truncate">
          <Mail className="h-3 w-3" /> {prospect.email}
        </p>
        <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
          <Phone className="h-3 w-3" /> {prospect.telephone}
        </p>
      </div>
      {prospect.clientId && (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/admin/clients/${prospect.clientId}`); }}
          className="mt-2 flex items-center gap-1.5 text-[11px] text-[#4a7c59] hover:text-[#3d6a4a] transition-colors"
        >
          <UserCheck className="h-3 w-3" /> Voir fiche client
        </button>
      )}
      {prospect.colonne === "ENVOI_DEVIS" && !isDragging && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const params = new URLSearchParams({
              source: "prospect",
              prospect_id: prospect.id,
              nom: prospect.nom,
              ...(prospect.email ? { email: prospect.email } : {}),
              ...(prospect.telephone ? { telephone: prospect.telephone } : {}),
            });
            router.push(`/admin/devis/nouveau?${params.toString()}`);
          }}
          className="mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] font-medium text-white bg-[#4a7c59] hover:bg-[#3d6a4a] rounded-md py-1.5 transition-colors"
        >
          <FileText className="h-3 w-3" /> Créer un devis
        </button>
      )}
    </div>
  );
}

function AddProspectModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Prospect) => void }) {
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", typeChantier: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { onAdd(await res.json()); return; }
    } catch {}
    onAdd({ ...form, id: Date.now().toString(), colonne: "TOUS_PROSPECTS", createdAt: new Date().toISOString() });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md mx-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Nouveau prospect</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <ModalField label="Nom *" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} required />
          <ModalField label="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <ModalField label="Téléphone" value={form.telephone} onChange={(v) => setForm({ ...form, telephone: v })} />
          <ModalField label="Type de chantier" value={form.typeChantier} onChange={(v) => setForm({ ...form, typeChantier: v })} />
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30" />
          </div>
          <button type="submit" disabled={saving || !form.nom || !form.email}
            className="w-full flex items-center justify-center gap-2 bg-[#4a7c59] hover:bg-[#3d6a4a] disabled:bg-gray-200 text-white disabled:text-gray-400 font-semibold py-2.5 rounded-lg transition-colors">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Ajout...</> : <><Plus className="h-4 w-4" /> Ajouter</>}
          </button>
        </form>
      </div>
    </div>
  );
}

function ModalField({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30" />
    </div>
  );
}
