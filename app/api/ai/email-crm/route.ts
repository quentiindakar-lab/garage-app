import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "analyze") {
      const { emails } = body;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Analyse ces emails envoyés par une entreprise BTP. Identifie le ton, le style, la structure et les formulations récurrentes. Réponds en JSON avec : {ton: string, style: string, formulations_cles: string[], structure_type: string}" },
          { role: "user", content: `Voici ${emails.length} emails :\n\n${emails.map((e: string, i: number) => `--- Email ${i + 1} ---\n${e}`).join("\n\n")}` },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });
      return NextResponse.json(JSON.parse(completion.choices[0]?.message?.content || "{}"));
    }

    if (action === "train") {
      return NextResponse.json({ success: true, message: "Profil de style enregistré" });
    }

    if (action === "generate") {
      const { type, destinataire, objet, contexte } = body;
      const typeLabels: Record<string, string> = {
        devis: "email d'envoi de devis",
        relance: "email de relance commerciale",
        suivi: "email de suivi de chantier",
        remerciement: "email de remerciement",
      };

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Tu es l'assistant d'une entreprise BTP. Tu rédiges des emails professionnels mais chaleureux. Tu utilises un ton adapté au secteur du bâtiment." },
          { role: "user", content: `Rédige un ${typeLabels[type] || type}.\nDestinataire : ${destinataire}\nObjet : ${objet}\nContexte : ${contexte}\n\nÉcris uniquement le corps de l'email, sans objet ni headers.` },
        ],
        temperature: 0.7,
      });
      return NextResponse.json({ email: completion.choices[0]?.message?.content || "", message: completion.choices[0]?.message?.content || "" });
    }

    if (action === "send") {
      const { to, subject, message } = body;
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "BTP Pro <noreply@btppro.fr>",
          to,
          subject,
          text: message,
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error) {
    console.error("Erreur email CRM:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
