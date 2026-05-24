"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/breadcrumb";
import {
  ArrowLeft,
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  Mail,
  MessageSquare,
  FileText,
  ClipboardPaste,
} from "lucide-react";

type Step = "onboarding_emails" | "onboarding_quiz" | "main";
type TonType = "professionnel" | "chaleureux" | "direct";
type LengthType = "court" | "moyen" | "detaille";

export default function EmailsIAPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("onboarding_emails");
  const [sampleEmails, setSampleEmails] = useState<string[]>(["", "", "", "", ""]);
  const [quiz, setQuiz] = useState<{ ton: TonType; secteur: string; longueur: LengthType }>({
    ton: "professionnel", secteur: "BTP", longueur: "moyen",
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [training, setTraining] = useState(false);

  const [emailType, setEmailType] = useState("devis");
  const [dest, setDest] = useState("");
  const [objet, setObjet] = useState("");
  const [contexte, setContexte] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const analyzeEmails = async () => {
    setAnalyzing(true);
    try {
      await fetch("/api/ai/email-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", emails: sampleEmails.filter(Boolean) }),
      });
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
    setAnalyzing(false);
    setStep("onboarding_quiz");
  };

  const trainAI = async () => {
    setTraining(true);
    try {
      await fetch("/api/ai/email-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "train", preferences: quiz }),
      });
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
    setTraining(false);
    setStep("main");
  };

  const generateEmail = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/email-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", type: emailType, destinataire: dest, objet, contexte }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedEmail(data.message || data.email || "");
      }
    } catch {
      setGeneratedEmail(`Bonjour,\n\nSuite à notre échange concernant ${contexte}, je souhaitais revenir vers vous.\n\nNous restons disponibles pour en discuter.\n\nCordialement,\nBTP Pro`);
    }
    setGenerating(false);
  };

  const sendEmail = async () => {
    setSending(true);
    try {
      await fetch("/api/ai/email-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", to: dest, subject: objet, message: generatedEmail }),
      });
    } catch {}
    setSending(false);
    setGeneratedEmail("");
    setDest(""); setObjet(""); setContexte("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Breadcrumb items={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "CRM", href: "/admin/crm" },
        { label: "Emails IA" },
      ]} />

      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin/crm")} className="btp-btn-secondary p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emails automatiques IA</h1>
          <p className="text-sm text-gray-500">Générez des emails dans le style de votre entreprise</p>
        </div>
      </div>

      {/* Onboarding Step 1 */}
      {step === "onboarding_emails" && (
        <div className="btp-card p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#4a7c59]/10 flex items-center justify-center">
              <span className="text-sm font-bold text-[#4a7c59]">1</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Importez vos emails existants</h2>
              <p className="text-sm text-gray-500">Collez le contenu de 5 emails envoyés par votre entreprise</p>
            </div>
          </div>
          <div className="space-y-3">
            {sampleEmails.map((email, i) => (
              <div key={i}>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email {i + 1} {i < 5 && "*"}</label>
                <textarea rows={3} value={email}
                  onChange={(e) => { const arr = [...sampleEmails]; arr[i] = e.target.value; setSampleEmails(arr); }}
                  className="btp-textarea px-3 py-2 text-sm w-full"
                  placeholder="Collez le texte d'un email envoyé..." />
              </div>
            ))}
          </div>
          <button onClick={analyzeEmails} disabled={analyzing || sampleEmails.filter(Boolean).length < 3}
            className="w-full flex items-center justify-center gap-2 bg-[#f59e0b] hover:bg-[#e8960a] disabled:bg-gray-200 text-black disabled:text-gray-400 font-semibold py-3 rounded-lg transition-colors">
            {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours...</> : <><Sparkles className="h-4 w-4" /> Analyser mes emails</>}
          </button>
        </div>
      )}

      {/* Onboarding Step 2 */}
      {step === "onboarding_quiz" && (
        <div className="btp-card p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#4a7c59]/10 flex items-center justify-center">
              <span className="text-sm font-bold text-[#4a7c59]">2</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Personnalisez votre style</h2>
              <p className="text-sm text-gray-500">Quelques questions pour affiner la génération</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Ton de vos communications</label>
              <div className="flex gap-2">
                {(["professionnel", "chaleureux", "direct"] as TonType[]).map((t) => (
                  <button key={t} onClick={() => setQuiz({ ...quiz, ton: t })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${quiz.ton === t ? "bg-[#4a7c59] text-white" : "btp-btn-secondary text-muted-foreground"}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Secteur principal</label>
              <input type="text" value={quiz.secteur} onChange={(e) => setQuiz({ ...quiz, secteur: e.target.value })}
                className="btp-input-field px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Longueur préférée</label>
              <div className="flex gap-2">
                {(["court", "moyen", "detaille"] as LengthType[]).map((l) => (
                  <button key={l} onClick={() => setQuiz({ ...quiz, longueur: l })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${quiz.longueur === l ? "bg-[#4a7c59] text-white" : "btp-btn-secondary text-muted-foreground"}`}>
                    {l === "detaille" ? "Détaillé" : l.charAt(0).toUpperCase() + l.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={trainAI} disabled={training}
            className="w-full flex items-center justify-center gap-2 bg-[#f59e0b] hover:bg-[#e8960a] disabled:bg-gray-200 text-black disabled:text-gray-400 font-semibold py-3 rounded-lg transition-colors">
            {training ? <><Loader2 className="h-4 w-4 animate-spin" /> Entraînement...</> : <><Sparkles className="h-4 w-4" /> Entraîner l&apos;IA</>}
          </button>
        </div>
      )}

      {/* Main email interface */}
      {step === "main" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="btp-card p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Composer un email</h2>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Type d&apos;email</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "devis", label: "Devis", icon: FileText },
                  { id: "relance", label: "Relance", icon: MessageSquare },
                  { id: "suivi", label: "Suivi chantier", icon: ClipboardPaste },
                  { id: "remerciement", label: "Remerciement", icon: CheckCircle2 },
                ].map((t) => (
                  <button key={t.id} onClick={() => setEmailType(t.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${emailType === t.id ? "bg-[#4a7c59]/10 text-[#4a7c59] border border-[#4a7c59]/30" : "btp-btn-secondary text-muted-foreground"}`}>
                    <t.icon className="h-3.5 w-3.5" /> {t.label}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Destinataire" type="email" value={dest} onChange={setDest} placeholder="client@email.com" />
            <Field label="Objet" value={objet} onChange={setObjet} placeholder="Votre devis pour..." />
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Contexte</label>
              <textarea rows={3} value={contexte} onChange={(e) => setContexte(e.target.value)}
                className="btp-textarea px-3 py-2 text-sm w-full"
                placeholder="Décrivez en quelques mots..." />
            </div>
            <button onClick={generateEmail} disabled={generating || !dest || !objet}
              className="w-full flex items-center justify-center gap-2 bg-[#f59e0b] hover:bg-[#e8960a] disabled:bg-gray-200 text-black disabled:text-gray-400 font-semibold py-2.5 rounded-lg transition-colors">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Génération...</> : <><Sparkles className="h-4 w-4" /> Générer l&apos;email</>}
            </button>
          </div>

          <div className="btp-card p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Aperçu</h2>
            {!generatedEmail ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Mail className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">L&apos;email généré apparaîtra ici</p>
              </div>
            ) : (
              <>
                <textarea rows={12} value={generatedEmail} onChange={(e) => setGeneratedEmail(e.target.value)}
                  className="btp-textarea px-4 py-3 text-sm w-full" />
                <div className="flex gap-2">
                  <button onClick={() => setGeneratedEmail("")}
                    className="flex-1 py-2.5 btp-btn-secondary text-sm text-muted-foreground transition-colors">
                    Annuler
                  </button>
                  <button onClick={generateEmail} disabled={generating}
                    className="btp-btn-secondary py-2.5 px-4 text-sm text-muted-foreground disabled:opacity-50 transition-colors">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </button>
                  <button onClick={sendEmail} disabled={sending}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#f59e0b] hover:bg-[#e8960a] text-black font-semibold py-2.5 rounded-lg text-sm transition-colors">
                    {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</> : <><Send className="h-4 w-4" /> Envoyer</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="btp-input-field px-3 py-2 text-sm w-full" />
    </div>
  );
}
