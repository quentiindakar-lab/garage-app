"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import {
  Building2,
  Mail,
  Palette,
  Save,
  Moon,
  Sun,
  Loader2,
  CheckCircle2,
  Key,
} from "lucide-react";

export default function ParametresPage() {
  const { theme, toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    adresse: "",
    telephone: "",
    email: "",
    siret: "",
    tauxTVA: "20",
    margeDefaut: "15",
    openaiKey: "",
    resendKey: "",
    smtpHost: "",
    smtpPort: "587",
    smtpEmail: "",
    smtpPassword: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/parametres");
        if (res.ok) {
          const data = await res.json();
          setForm({
            nom: data.nomEntreprise || "",
            adresse: data.adresse || "",
            telephone: data.telephone || "",
            email: data.email || "",
            siret: data.siret || "",
            tauxTVA: String(data.tva ?? 20),
            margeDefaut: String(data.margeDefaut ?? 15),
            openaiKey: data.openaiKey || "",
            resendKey: data.resendKey || "",
            smtpHost: data.smtpHost || "",
            smtpPort: String(data.smtpPort || 587),
            smtpEmail: data.smtpEmail || "",
            smtpPassword: data.smtpPassword || "",
          });
        }
      } catch {}
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/parametres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomEntreprise: form.nom || null,
          siret: form.siret || null,
          adresse: form.adresse || null,
          telephone: form.telephone || null,
          email: form.email || null,
          tva: form.tauxTVA,
          margeDefaut: form.margeDefaut,
          openaiKey: form.openaiKey || null,
          resendKey: form.resendKey || null,
          smtpHost: form.smtpHost || null,
          smtpPort: form.smtpPort,
          smtpEmail: form.smtpEmail || null,
          smtpPassword: form.smtpPassword || null,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-slate-400 mt-1">Configuration de l&apos;application</p>
      </div>

      {/* Entreprise */}
      <Section icon={Building2} title="Informations entreprise">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom de l'entreprise" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} />
          <Field label="SIRET" value={form.siret} onChange={(v) => setForm({ ...form, siret: v })} />
          <Field label="Adresse" value={form.adresse} onChange={(v) => setForm({ ...form, adresse: v })} />
          <Field label="Téléphone" value={form.telephone} onChange={(v) => setForm({ ...form, telephone: v })} />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="TVA (%)" type="number" value={form.tauxTVA} onChange={(v) => setForm({ ...form, tauxTVA: v })} />
            <Field label="Marge défaut (%)" type="number" value={form.margeDefaut} onChange={(v) => setForm({ ...form, margeDefaut: v })} />
          </div>
        </div>
      </Section>

      {/* Thème */}
      <Section icon={Palette} title="Apparence">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Mode {theme === "dark" ? "sombre" : "clair"}</p>
            <p className="text-xs text-slate-500">Basculer entre mode clair et sombre</p>
          </div>
          <button onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300 hover:text-white transition-colors">
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Mode clair" : "Mode sombre"}
          </button>
        </div>
      </Section>

      {/* API Keys */}
      <Section icon={Key} title="Clés API">
        <div className="space-y-4">
          <Field label="OpenAI API Key" type="password" value={form.openaiKey} onChange={(v) => setForm({ ...form, openaiKey: v })} placeholder="sk-..." />
          <Field label="Resend API Key" type="password" value={form.resendKey} onChange={(v) => setForm({ ...form, resendKey: v })} placeholder="re_..." />
        </div>
      </Section>

      {/* SMTP */}
      <Section icon={Mail} title="Email SMTP">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Serveur SMTP" value={form.smtpHost} onChange={(v) => setForm({ ...form, smtpHost: v })} placeholder="smtp.gmail.com" />
          <Field label="Port" value={form.smtpPort} onChange={(v) => setForm({ ...form, smtpPort: v })} />
          <Field label="Email" value={form.smtpEmail} onChange={(v) => setForm({ ...form, smtpEmail: v })} placeholder="contact@votreentreprise.fr" />
          <Field label="Mot de passe d'application" type="password" value={form.smtpPassword} onChange={(v) => setForm({ ...form, smtpPassword: v })} />
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-900 disabled:text-slate-500 font-semibold py-3 rounded-lg transition-colors">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? "Enregistrement..." : saved ? "Enregistré !" : "Enregistrer les paramètres"}
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Building2; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
      <h2 className="text-base font-semibold text-white flex items-center gap-2">
        <Icon className="h-4 w-4 text-amber-400" /> {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
    </div>
  );
}
