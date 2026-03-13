"use client";

import { useState, useEffect } from "react";
import { BTP_CONFIG } from "@/config/btp.config";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Phone,
  Mail,
  HardHat,
  Loader2,
  X,
  Trash2,
  User,
  CheckCircle2,
  XCircle,
  MapPin,
  ExternalLink,
} from "lucide-react";

interface ChantierRef {
  id: string;
  nom: string;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  telephone: string;
  email: string;
  actif: boolean;
  specialite?: string;
  chantiersActuels?: ChantierRef[];
  chantiersPasses?: ChantierRef[];
}

const ROLE_STYLE: Record<string, { bg: string; text: string }> = {
  "Chef de chantier": { bg: "bg-amber-500/10", text: "text-amber-400" },
  Ouvrier: { bg: "bg-blue-500/10", text: "text-blue-400" },
  Commercial: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  Administratif: { bg: "bg-purple-500/10", text: "text-purple-400" },
  Gérant: { bg: "bg-red-500/10", text: "text-red-400" },
};

const DEMO_MEMBRES: Membre[] = [
  { id: "1", nom: "Dupont", prenom: "Marc", role: "Chef de chantier", telephone: "06 12 34 56 78", email: "marc@btppro.fr", actif: true, specialite: "Maçonnerie", chantiersActuels: [{ id: "demo1", nom: "Rénovation cuisine" }] },
  { id: "2", nom: "Bernard", prenom: "Luc", role: "Ouvrier", telephone: "06 98 76 54 32", email: "luc@btppro.fr", actif: true, specialite: "Plomberie", chantiersActuels: [{ id: "demo2", nom: "Salle de bain" }] },
  { id: "3", nom: "Petit", prenom: "Thomas", role: "Ouvrier", telephone: "06 55 44 33 22", email: "thomas@btppro.fr", actif: true, specialite: "Carrelage", chantiersActuels: [] },
  { id: "4", nom: "Martin", prenom: "Julie", role: "Commercial", telephone: "06 11 22 33 44", email: "julie@btppro.fr", actif: true, chantiersActuels: [] },
  { id: "5", nom: "Simon", prenom: "Paul", role: "Gérant", telephone: "06 77 88 99 00", email: "paul@btppro.fr", actif: true, chantiersActuels: [] },
  { id: "6", nom: "Leroy", prenom: "Antoine", role: "Ouvrier", telephone: "06 33 22 11 00", email: "antoine@btppro.fr", actif: false, specialite: "Peinture", chantiersActuels: [] },
];

export default function EquipePage() {
  const router = useRouter();
  const [membres, setMembres] = useState<Membre[]>(DEMO_MEMBRES);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Membre | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/equipe");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) setMembres(data);
        }
      } catch {}
    })();
  }, []);

  const filtered = membres.filter((m) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return m.nom.toLowerCase().includes(s) || m.prenom.toLowerCase().includes(s) || m.role.toLowerCase().includes(s);
  });

  const toggleActif = async (id: string) => {
    setMembres((ms) => ms.map((m) => m.id === id ? { ...m, actif: !m.actif } : m));
    try {
      await fetch("/api/equipe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, toggleActif: true }),
      });
    } catch {}
  };

  const deleteMembre = async (id: string) => {
    setMembres((ms) => ms.filter((m) => m.id !== id));
    try {
      await fetch(`/api/equipe?id=${id}`, { method: "DELETE" });
    } catch {}
  };

  const actifs = membres.filter((m) => m.actif).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Équipe</h1>
          <p className="text-slate-400 mt-1">{actifs} membre{actifs > 1 ? "s" : ""} actif{actifs > 1 ? "s" : ""} sur {membres.length}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm transition-colors">
          <Plus className="h-4 w-4" /> Ajouter un membre
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un membre..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((m) => {
          const hue = (m.nom + m.prenom).split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
          const initials = `${m.prenom[0]}${m.nom[0]}`.toUpperCase();
          const roleStyle = ROLE_STYLE[m.role] || ROLE_STYLE.Ouvrier;

          return (
            <div key={m.id}
              className={`rounded-xl border bg-slate-900 p-5 transition-all cursor-pointer group ${m.actif ? "border-slate-800 hover:border-slate-700" : "border-slate-800/50 opacity-60"}`}
              onClick={() => setSelected(m)}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: `hsl(${hue}, 55%, 40%)` }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
                      {m.prenom} {m.nom}
                    </h3>
                    {!m.actif && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">Inactif</span>}
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                    {m.role}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-sm text-slate-400">
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-600" />{m.telephone}</div>
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-600" /><span className="truncate">{m.email}</span></div>
                {m.specialite && <div className="flex items-center gap-2"><HardHat className="h-3.5 w-3.5 text-slate-600" />{m.specialite}</div>}
              </div>

              {m.chantiersActuels && m.chantiersActuels.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/50">
                  <div className="flex flex-wrap gap-1">
                    {m.chantiersActuels.map((c) => (
                      <span key={c.id} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">{c.nom}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">Aucun membre trouvé</p>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md mx-4 rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{selected.prenom} {selected.nom}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-400"><Mail className="h-4 w-4 text-slate-600" />{selected.email}</div>
              <div className="flex items-center gap-2 text-slate-400"><Phone className="h-4 w-4 text-slate-600" />{selected.telephone}</div>
              <div className="flex items-center gap-2 text-slate-400"><HardHat className="h-4 w-4 text-slate-600" />Rôle : {selected.role}</div>
              {selected.specialite && <div className="flex items-center gap-2 text-slate-400"><MapPin className="h-4 w-4 text-slate-600" />Spécialité : {selected.specialite}</div>}
            </div>
            {selected.chantiersActuels && selected.chantiersActuels.length > 0 && (
              <div>
                <p className="text-sm font-medium text-white mb-2">Chantiers en cours</p>
                <div className="space-y-1.5">
                  {selected.chantiersActuels.map((c) => (
                    <button key={c.id} onClick={() => { setSelected(null); router.push(`/admin/chantiers/${c.id}`); }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors">
                      <span>{c.nom}</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selected.chantiersPasses && selected.chantiersPasses.length > 0 && (
              <div>
                <p className="text-sm font-medium text-white mb-2">Chantiers passés</p>
                <div className="space-y-1.5">
                  {selected.chantiersPasses.map((c) => (
                    <button key={c.id} onClick={() => { setSelected(null); router.push(`/admin/chantiers/${c.id}`); }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium hover:text-white transition-colors">
                      <span>{c.nom}</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <button onClick={() => { toggleActif(selected.id); setSelected(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${selected.actif ? "border border-red-500/30 text-red-400 hover:bg-red-500/10" : "border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"}`}>
                {selected.actif ? <><XCircle className="h-4 w-4" /> Désactiver</> : <><CheckCircle2 className="h-4 w-4" /> Réactiver</>}
              </button>
              <button onClick={() => { deleteMembre(selected.id); setSelected(null); }}
                className="py-2.5 px-4 rounded-lg border border-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && <AddMembreModal onClose={() => setShowAdd(false)} onAdd={(m) => { setMembres((ms) => [m, ...ms]); setShowAdd(false); }} />}
    </div>
  );
}

function AddMembreModal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: Membre) => void }) {
  const [form, setForm] = useState({ nom: "", prenom: "", role: "Ouvrier", telephone: "", email: "", specialite: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const membre: Membre = { ...form, id: Date.now().toString(), actif: true, chantiersActuels: [] };
    try {
      const res = await fetch("/api/equipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { onAdd(await res.json()); return; }
    } catch {}
    onAdd(membre);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md mx-4 rounded-xl border border-slate-700 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Ajouter un membre</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MField label="Prénom *" value={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} required />
            <MField label="Nom *" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Rôle</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50">
              {BTP_CONFIG.roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <MField label="Téléphone" value={form.telephone} onChange={(v) => setForm({ ...form, telephone: v })} />
          <MField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <MField label="Spécialité" value={form.specialite} onChange={(v) => setForm({ ...form, specialite: v })} placeholder="Plomberie, carrelage..." />
          <button type="submit" disabled={saving || !form.nom || !form.prenom}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-900 disabled:text-slate-500 font-semibold py-2.5 rounded-lg transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Ajouter
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
