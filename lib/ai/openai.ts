import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "sk-placeholder",
  });
}

export async function genererEstimationChantier(prompt: string): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Tu es un expert en chiffrage et estimation de chantiers BTP en France. Tu réponds uniquement en JSON valide.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  return response.choices[0].message.content || "{}";
}

export async function genererEmailBTP(
  type: string,
  contexte: string,
  style?: string
): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Tu es l'assistant d'une entreprise BTP. Tu rédiges des emails professionnels adaptés au secteur du bâtiment. ${style || "Ton professionnel mais chaleureux."}`,
      },
      {
        role: "user",
        content: `Rédige un email de type "${type}". Contexte : ${contexte}`,
      },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || "";
}

export async function analyserTicketCaisse(imageBase64: string): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Analyse cette photo de ticket de caisse et extrais les informations. Réponds uniquement en JSON : {"montant": number, "date": "YYYY-MM-DD", "fournisseur": "string", "categorie": "Repas" | "Carburant" | "Matériaux" | "Outillage" | "Transport" | "Autre"}`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyse ce ticket :" },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  return response.choices[0].message.content || "{}";
}
