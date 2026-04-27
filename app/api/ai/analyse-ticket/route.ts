import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/ai/anthropic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: "Image requise" }, { status: 400 });
    }

    const mediaType = image.startsWith("/9j") ? "image/jpeg"
      : image.startsWith("iVBOR") ? "image/png"
      : image.startsWith("UklG") ? "image/webp"
      : "image/jpeg";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `Analyse cette photo de ticket de caisse et extrais les informations.
Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "montant": number,
  "date": "YYYY-MM-DD",
  "fournisseur": "string",
  "categorie": "Repas" | "Carburant" | "Matériaux" | "Outillage" | "Transport" | "Autre"
}`,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analyse ce ticket de caisse :" },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: image,
              },
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    if (!text) throw new Error("Pas de réponse de l'IA");

    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur analyse ticket:", error);
    return NextResponse.json({ error: "Erreur lors de l'analyse" }, { status: 500 });
  }
}
