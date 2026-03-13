import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom, adresse, surface, metiers, materiaux, localisation, delaiSouhaite, margePercent, description, chantierId } = body;

    const prompt = `Tu es un expert en chiffrage BTP. À partir des informations fournies, génère une estimation complète et détaillée.

Informations du chantier :
- Nom : ${nom || "Non spécifié"}
- Adresse : ${adresse || "Non spécifiée"}
- Surface : ${surface || "Non spécifiée"} m²
- Types de travaux : ${metiers?.join(", ") || "Non spécifié"}
- Matériaux disponibles : ${materiaux || "Non spécifié"}
- Localisation : ${localisation || "Non spécifiée"}
- Délai souhaité : ${delaiSouhaite || "Non spécifié"} semaines
- Marge souhaitée : ${margePercent || 20}%
- Description : ${description || "Non spécifiée"}

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "duree_estimee": "string (ex: '3 à 4 semaines')",
  "nombre_ouvriers": number,
  "materiaux": [{"nom": "string", "quantite": "string", "cout_unitaire": number, "cout_total": number}],
  "couts": {
    "main_oeuvre": number,
    "materiaux": number,
    "transport": number,
    "autres": number,
    "total_ht": number,
    "marge": number,
    "total_ttc": number
  },
  "recommandations": ["string"],
  "risques": ["string"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Tu es un expert en chiffrage et estimation de chantiers BTP en France. Tu réponds uniquement en JSON valide." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Pas de réponse de l'IA");

    const result = JSON.parse(content);

    const estimation = await prisma.estimation.create({
      data: {
        nom: nom || "Estimation sans nom",
        adresse: adresse || null,
        surface: surface ? parseFloat(surface) : null,
        typesTravaux: metiers || [],
        marge: margePercent ? parseFloat(margePercent) : 15,
        resultatsJson: result,
        chantierId: chantierId || null,
      },
    });

    return NextResponse.json({ ...result, estimationId: estimation.id });
  } catch (error) {
    console.error("Erreur estimation IA:", error);
    return NextResponse.json({ error: "Erreur lors de l'estimation" }, { status: 500 });
  }
}
