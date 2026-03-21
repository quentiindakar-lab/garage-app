"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BTP_CONFIG } from "@/config/btp.config";
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Upload,
  Sparkles,
  Search,
  UserCheck,
} from "lucide-react";

interface ClientOption {
  id: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
}

export default function NouveauChantierPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [form, setForm] = useState({
    nom: "",
    adresse: "",
    type: "",
    surface: "",
    materiaux: "",
    dateDebut: "",
    dateFin: "",
    description: "",
  });

  const [clientId, setClientId] = useState<string | null>(searchParams.get("clientId"));
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<ClientOption[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ nom: "", prenom: "", email: "", telephone: "" });
  const [savingClient, setSavingClient] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const paramClientId = searchParams.get("clientId");
    if (paramClientId) {
      fetch(`/api/clients?id=${paramClientId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.id) {
            setSelectedClient({ id: data.id, nom: data.nom, prenom: data.prenom, email: data.email, telephone: data.telephone });
            setClientId(data.id);
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => {
    if (clientSearch.length < 1) { setClientResults([]); return; }
    const t = setTimeout(() => {
      fetch("/api/clients")
        .then((r) => r.json())
        .then((data: ClientOption[]) => {
          const q = clientSearch.toLowerCase();
          const filtered = Array.isArray(data)
            ? data.filter(
                (c) =>
                  c.nom.toLowerCase().includes(q) ||
                  c.prenom?.toLowerCase().includes(q) ||
                  c.email?.toLowerCase().includes(q)
              )
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

  const handleCreateClient = async () => {
    if (!newClient.nom.trim()) return;
    setSavingClient(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      if (res.ok) {
        const created = await res.json();
        setSelectedClient({ id: created.id, nom: created.nom, prenom: created.prenom, email: created.email, telephone: created.telephone });
        setClientId(created.id);
        setShowNewClientModal(false);
        setNewClient({ nom: "", prenom: "", email: "", telephone: "" });
      }
    } catch {} finally { setSavingClient(false); }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setPhotos((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/chantiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          surface: form.surface ? parseFloat(form.surface) : null,
          dateDebut: form.dateDebut || null,
          dateFin: form.dateFin || null,
          clientId: clientId || null,
        }),
      });
      if (res.ok) {
        router.push("/admin/chantiers");
      }
    } catch {
      router.push("/admin/chantiers");
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau chantier</h1>
          <p className="text-sm text-gray-500">Renseignez les informations du chantier</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[#4a7c59]" /> Client
          </h2>
          {selectedClient ? (
            <div className="flex items-center justify-between rounded-lg border border-[#4a7c59]/30 bg-[#4a7c59]/5 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedClient.nom} {selectedClient.prenom || ""}</p>
                {selectedClient.email && <p className="text-xs text-gray-500">{selectedClient.email}</p>}
              </div>
              <button type="button" onClick={() => { setSelectedClient(null); setClientId(null); }}
                className="text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex gap-3">
              <div ref={clientRef} className="relative flex-1">
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
                        onClick={() => { setSelectedClient(c); setClientId(c.id); setShowClientDropdown(false); setClientSearch(""); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg">
                        <span className="font-medium text-gray-900">{c.nom} {c.prenom || ""}</span>
                        {c.email && <span className="ml-2 text-xs text-gray-400">{c.email}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setShowNewClientModal(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-[#4a7c59] hover:bg-[#4a7c59]/5 transition-colors whitespace-nowrap">
                <Plus className="h-4 w-4" /> Créer un client
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Informations générales</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Nom du chantier *" value={form.nom} onChange={(v) => set("nom", v)} placeholder="Rénovation cuisine" required />
            <InputField label="Adresse *" value={form.adresse} onChange={(v) => set("adresse", v)} placeholder="12 rue Victor Hugo, Pau" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Type de chantier</label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
              >
                <option value="">Sélectionner</option>
                {BTP_CONFIG.metiers.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <InputField label="Surface (m²)" type="number" value={form.surface} onChange={(v) => set("surface", v)} placeholder="45" />
            <InputField label="Matériaux" value={form.materiaux} onChange={(v) => set("materiaux", v)} placeholder="Carrelage, placo..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Date de début" type="date" value={form.dateDebut} onChange={(v) => set("dateDebut", v)} />
            <InputField label="Date de fin" type="date" value={form.dateFin} onChange={(v) => set("dateFin", v)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Notes / observations</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 resize-none"
              placeholder="Détails supplémentaires..."
            />
          </div>
        </div>

        {/* Photos */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Photos du chantier</h2>
          <div className="flex flex-wrap gap-3">
            {photos.map((photo, i) => (
              <div key={i} className="relative group">
                <div className="w-24 h-24 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
                  <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#4a7c59]/50 transition-colors">
              <Upload className="h-5 w-5 text-gray-400 mb-1" />
              <span className="text-[10px] text-gray-400">Ajouter</span>
              <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !form.nom || !form.adresse}
            className="flex-1 flex items-center justify-center gap-2 bg-[#f59e0b] hover:bg-[#e8960a] disabled:bg-gray-200 disabled:text-gray-400 text-black font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Création..." : "Créer le chantier"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/estimation")}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-200 bg-white text-[#4a7c59] hover:bg-gray-50 font-medium text-sm transition-colors shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            Estimer avec l&apos;IA
          </button>
        </div>
      </form>

      {/* Modal création client rapide */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNewClientModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Nouveau client</h2>
              <button onClick={() => setShowNewClientModal(false)} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Nom *" value={newClient.nom} onChange={(v) => setNewClient({ ...newClient, nom: v })} />
                <InputField label="Prénom" value={newClient.prenom} onChange={(v) => setNewClient({ ...newClient, prenom: v })} />
              </div>
              <InputField label="Email" value={newClient.email} onChange={(v) => setNewClient({ ...newClient, email: v })} type="email" />
              <InputField label="Téléphone" value={newClient.telephone} onChange={(v) => setNewClient({ ...newClient, telephone: v })} type="tel" />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setShowNewClientModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
              <button onClick={handleCreateClient} disabled={!newClient.nom.trim() || savingClient}
                className="flex items-center gap-2 rounded-lg bg-[#4a7c59] hover:bg-[#3d6a4a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {savingClient ? <><Loader2 className="h-4 w-4 animate-spin" /> Création...</> : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
      />
    </div>
  );
}
