"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function ParametresPage() {
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
    formeJuridique: "",
    numeroTva: "",
    assureurNom: "",
    assuranceNumeroPolice: "",
    assuranceZoneCouverture: "",
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
            formeJuridique: data.formeJuridique || "",
            numeroTva: data.numeroTva || "",
            assureurNom: data.assureurNom || "",
            assuranceNumeroPolice: data.assuranceNumeroPolice || "",
            assuranceZoneCouverture: data.assuranceZoneCouverture || "",
          });
        }
      } catch {}
    })();
  }, []);

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

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
          formeJuridique: form.formeJuridique || null,
          numeroTva: form.numeroTva || null,
          assureurNom: form.assureurNom || null,
          assuranceNumeroPolice: form.assuranceNumeroPolice || null,
          assuranceZoneCouverture: form.assuranceZoneCouverture || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("Erreur : " + (err.error || "Sauvegarde échouée"));
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 mt-1">Configuration de l&apos;application</p>
      </div>

      {/* Entreprise */}
      <Section icon={Building2} title="Informations entreprise">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom de l'entreprise" value={form.nom} onChange={set("nom")} />
          <Field label="SIRET" value={form.siret} onChange={set("siret")} />
          <Field label="Forme juridique" value={form.formeJuridique} onChange={set("formeJuridique")} placeholder="Ex : SARL, SAS, EI, Auto-entrepreneur" />
          <Field label="N° TVA intracommunautaire" value={form.numeroTva} onChange={set("numeroTva")} placeholder="Ex : FR12345678901" />
          <Field label="Adresse" value={form.adresse} onChange={set("adresse")} />
          <Field label="Téléphone" value={form.telephone} onChange={set("telephone")} />
          <Field label="Email" value={form.email} onChange={set("email")} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="TVA (%)" type="number" value={form.tauxTVA} onChange={set("tauxTVA")} />
            <Field label="Marge défaut (%)" type="number" value={form.margeDefaut} onChange={set("margeDefaut")} />
          </div>
        </div>
      </Section>

      {/* Assurance décennale */}
      <Section icon={ShieldCheck} title="Assurance décennale">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom de l'assureur" value={form.assureurNom} onChange={set("assureurNom")} placeholder="Ex : AXA, Allianz, MAAF..." />
          <Field label="Numéro de police" value={form.assuranceNumeroPolice} onChange={set("assuranceNumeroPolice")} placeholder="Ex : 12-345-678-9" />
          <div className="sm:col-span-2">
            <Field label="Zone de couverture géographique" value={form.assuranceZoneCouverture} onChange={set("assuranceZoneCouverture")} placeholder="Ex : France métropolitaine" />
          </div>
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-[#4a7c59] hover:bg-[#3d6a4a] hover:-translate-y-[2px] hover:shadow-md disabled:bg-gray-200 disabled:hover:translate-y-0 disabled:hover:shadow-none text-white disabled:text-gray-400 font-semibold py-3 rounded-lg transition-[transform,box-shadow,background-color] duration-200 ease-in-out">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? "Enregistrement..." : saved ? "Enregistré !" : "Enregistrer les paramètres"}
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Building2; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#4a7c59]" /> {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30" />
    </div>
  );
}
