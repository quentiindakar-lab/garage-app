import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel } from "@/lib/supabase";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { DevisPDF } from "@/lib/pdf/DevisPDF";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const isDownload = req.nextUrl.searchParams.get("download") === "true";

  try {
    const { data: rawDevis, error: devisErr } = await supabase
      .from("devis")
      .select("id, numero, statut, client_nom, client_email, client_telephone, client_adresse, chantier_adresse, date_emission, date_validite, lignes, total_ht, tva_montant, total_ttc, acompte_pourcentage, conditions_paiement, notes, mention_dechets")
      .eq("id", params.id)
      .single();

    if (devisErr || !rawDevis) {
      return NextResponse.json({ error: "Devis non trouvé" }, { status: 404 });
    }

    const devis = toCamel(rawDevis) as any;

    const { data: rawParams } = await supabase
      .from("settings")
      .select("*")
      .eq("id", "singleton")
      .single();

    const entreprise = rawParams ? (toCamel(rawParams) as any) : {};

    const pdfBuffer = await renderToBuffer(
      React.createElement(DevisPDF, { devis, entreprise }) as React.ReactElement<any>
    );

    // Mode téléchargement direct — pas d'email, pas de changement de statut
    if (isDownload) {
      return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${devis.numero}.pdf"`,
          "Content-Length": String(pdfBuffer.byteLength),
        },
      });
    }

    if (!devis.clientEmail) {
      return NextResponse.json({ error: "Aucun email client sur ce devis" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY non configurée" }, { status: 500 });
    }

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: "BTP Pro <onboarding@resend.dev>",
      to: devis.clientEmail,
      subject: `Votre devis ${devis.numero}`,
      text: `Bonjour ${devis.clientNom},\n\nVeuillez trouver en pièce jointe votre devis ${devis.numero}.\n\nCordialement,\n${entreprise.nomEntreprise || "BTP Pro"}`,
      attachments: [
        {
          filename: `${devis.numero}.pdf`,
          content: Buffer.from(pdfBuffer).toString("base64"),
        },
      ],
    });

    console.log("Resend devis response:", result);

    const { error: updateErr } = await supabase
      .from("devis")
      .update({ statut: "envoye", updated_at: new Date().toISOString() })
      .eq("id", params.id);

    if (updateErr) console.error("Erreur mise à jour statut:", updateErr);

    return NextResponse.json({ success: true, numero: devis.numero });
  } catch (error) {
    console.error("POST /api/devis/[id]/send:", error);
    return NextResponse.json({ error: "Erreur envoi" }, { status: 500 });
  }
}
