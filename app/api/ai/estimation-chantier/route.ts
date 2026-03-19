import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/ai/anthropic";
import { supabase, toCamel } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nom,
      adresse,
      surface,
      metiers,
      materiaux,
      localisation,
      delaiSouhaite,
      margePercent,
      description,
      chantierId,
    } = body;

    const prompt = `À partir des informations fournies, génère une estimation complète et détaillée.

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

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system:
        "Tu es un expert en chiffrage et estimation de chantiers BTP en France. Tu réponds uniquement en JSON valide.",
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";
    if (!rawText) throw new Error("Pas de réponse de l'IA");

    const cleanText = rawText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const result = JSON.parse(cleanText);

    const { data: estimation, error } = await supabase
      .from("estimations")
      .insert({
        nom: nom || "Estimation sans nom",
        adresse: adresse || null,
        surface: surface ? parseFloat(surface) : null,
        types_travaux: metiers || [],
        marge: margePercent ? parseFloat(margePercent) : 15,
        resultats_json: result,
        chantier_id: chantierId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...result, estimationId: estimation?.id });
  } catch (error) {
    console.error("Erreur estimation IA:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
