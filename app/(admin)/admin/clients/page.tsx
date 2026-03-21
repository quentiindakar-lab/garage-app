"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Phone,
  Mail,
  HardHat,
  X,
  Loader2,
  Building2,
  User,
} from "lucide-react";
import { formatMoney } from "@/lib/utils";

interface Client {
  id: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  entreprise?: string;
  typeClient: string;
  notes?: string;
  nbChantiers: number;
  caTotal: number;
  createdAt: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    entreprise: "",
    typeClient: "PARTICULIER",
    notes: "",
  });

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreate = async () => {
    if (!form.nom.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ nom: "", prenom: "", email: "", telephone: "", adresse: "", entreprise: "", typeClient: "PARTICULIER", notes: "" });
        fetchClients();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filtered = Array.isArray(clients)
    ? clients.filter((c) => {
        const q = search.toLowerCase();
        return (
          c.nom.toLowerCase().includes(q) ||
          c.prenom?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.telephone?.includes(q) ||
          c.entreprise?.toLowerCase().includes(q)
        );
      })
    : [];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-sm text-muted-foreground">{clients.length} client{clients.length > 1 ? "s" : ""} au total</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btp-btn-primary px-4 py-2.5 text-sm font-semibold shadow-lg shadow-black/20"
        >
          <Plus className="h-4 w-4" />
          Nouveau client
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="btp-input rounded-md py-2.5 pl-10 pr-4 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {filtered.map((client) => (
            <motion.div
              key={client.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => router.push(`/admin/clients/${client.id}`)}
              className="cursor-pointer btp-card p-5 transition-colors hover:border-white/10 hover:bg-card/90"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-content-center rounded-lg bg-[#4a7c59]/10">
                    {client.typeClient === "ENTREPRISE" ? (
                      <Building2 className="h-5 w-5 text-[#4a7c59]" />
                    ) : (
                      <User className="h-5 w-5 text-[#4a7c59]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {client.nom} {client.prenom || ""}
                    </h3>
                    {client.entreprise && (
                      <p className="text-xs text-muted-foreground">{client.entreprise}</p>
                    )}
                  </div>
                </div>
                <span className="rounded-full bg-[var(--muted)] border border-border/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {client.typeClient === "ENTREPRISE" ? "Entreprise" : "Particulier"}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.telephone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{client.telephone}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <HardHat className="h-3.5 w-3.5" />
                  <span>{client.nbChantiers} chantier{client.nbChantiers > 1 ? "s" : ""}</span>
                </div>
                <span className="text-sm font-semibold text-[#4a7c59]">
                  {formatMoney(client.caTotal)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun client trouvé</p>
          <p className="text-sm text-muted-foreground/80 mt-1">
            {search ? "Modifiez votre recherche" : "Créez votre premier client"}
          </p>
        </div>
      )}

      {/* Modal création */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Nouveau client</h2>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="Nom *" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} />
                  <ModalField label="Prénom" value={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
                  <ModalField label="Téléphone" value={form.telephone} onChange={(v) => setForm({ ...form, telephone: v })} type="tel" />
                </div>
                <ModalField label="Adresse" value={form.adresse} onChange={(v) => setForm({ ...form, adresse: v })} />
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="Entreprise" value={form.entreprise} onChange={(v) => setForm({ ...form, entreprise: v })} />
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Type</label>
                    <select
                      value={form.typeClient}
                      onChange={(e) => setForm({ ...form, typeClient: e.target.value })}
                      className="btp-input rounded-md px-3 py-2 text-sm"
                    >
                      <option value="PARTICULIER">Particulier</option>
                      <option value="ENTREPRISE">Entreprise</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className="btp-input rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="btp-btn-ghost px-4 py-2 text-sm border border-border"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!form.nom.trim() || saving}
                  className="btp-btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold shadow-lg disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Créer le client
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="btp-input rounded-md px-3 py-2 text-sm"
      />
    </div>
  );
}
