import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: "Image requise" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyse cette photo de ticket de caisse et extrais les informations.
Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "montant": number,
  "date": "YYYY-MM-DD",
  "fournisseur": "string",
  "categorie": "Repas" | "Carburant" | "Matériaux" | "Outillage" | "Transport" | "Autre"
}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyse ce ticket de caisse :" },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${image}`, detail: "high" },
            },
          ],
        },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Pas de réponse de l'IA");

    const result = JSON.parse(content);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur analyse ticket:", error);
    return NextResponse.json({ error: "Erreur lors de l'analyse" }, { status: 500 });
  }
}
