import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel } from "@/lib/supabase";

function calcTotals(lignes: any[]): { totalHt: number; tvaMontant: number; totalTtc: number } {
  let totalHt = 0;
  let tvaMontant = 0;
  for (const l of lignes) {
    const ht = (parseFloat(l.quantite) || 0) * (parseFloat(l.prixUnitaireHt) || 0);
    const tva = l.tvaTaux === "exempt" ? 0 : ht * ((parseFloat(l.tvaTaux) || 0) / 100);
    totalHt += ht;
    tvaMontant += tva;
  }
  return { totalHt, tvaMontant, totalTtc: totalHt + tvaMontant };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from("devis")
      .select("id, numero, statut, client_id, prospect_id, client_nom, client_email, client_telephone, client_adresse, chantier_adresse, date_emission, date_validite, lignes, total_ht, tva_montant, total_ttc, acompte_pourcentage, conditions_paiement, notes, mention_dechets, created_at, updated_at")
      .eq("id", params.id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Devis non trouvé" }, { status: 404 });
    return NextResponse.json(toCamel(data));
  } catch (error) {
    console.error("GET /api/devis/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: existing } = await supabase
      .from("devis")
      .select("statut")
      .eq("id", params.id)
      .single();

    if (!existing) return NextResponse.json({ error: "Devis non trouvé" }, { status: 404 });

    const body = await req.json();

    // Transitions de statut autorisées depuis "envoye"
    const STATUT_TRANSITIONS: Record<string, string[]> = {
      envoye: ["signe", "refuse"],
    };
    if (existing.statut !== "brouillon") {
      const allowed = STATUT_TRANSITIONS[existing.statut] || [];
      if (!body.statut || !allowed.includes(body.statut)) {
        return NextResponse.json({ error: "Modification non autorisée pour ce statut" }, { status: 400 });
      }
      const { data, error } = await supabase
        .from("devis")
        .update({ statut: body.statut, updated_at: new Date().toISOString() })
        .eq("id", params.id)
        .select("id, numero, statut, client_nom, total_ttc, date_emission, date_validite, updated_at")
        .single();
      if (error) throw error;
      return NextResponse.json(toCamel(data));
    }

    const lignes = Array.isArray(body.lignes) ? body.lignes : undefined;
    const totals = lignes ? calcTotals(lignes) : null;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.statut !== undefined) updateData.statut = body.statut;
    if (body.clientNom !== undefined) updateData.client_nom = body.clientNom;
    if (body.clientEmail !== undefined) updateData.client_email = body.clientEmail;
    if (body.clientTelephone !== undefined) updateData.client_telephone = body.clientTelephone;
    if (body.clientAdresse !== undefined) updateData.client_adresse = body.clientAdresse;
    if (body.chantierAdresse !== undefined) updateData.chantier_adresse = body.chantierAdresse;
    if (body.dateValidite !== undefined) updateData.date_validite = body.dateValidite;
    if (body.acomptePourcentage !== undefined) updateData.acompte_pourcentage = body.acomptePourcentage;
    if (body.conditionsPaiement !== undefined) updateData.conditions_paiement = body.conditionsPaiement;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.mentionDechets !== undefined) updateData.mention_dechets = body.mentionDechets;
    if (lignes !== undefined) {
      updateData.lignes = lignes;
      updateData.total_ht = totals!.totalHt;
      updateData.tva_montant = totals!.tvaMontant;
      updateData.total_ttc = totals!.totalTtc;
    }

    const { data, error } = await supabase
      .from("devis")
      .update(updateData)
      .eq("id", params.id)
      .select("id, numero, statut, client_nom, total_ttc, date_emission, date_validite, updated_at")
      .single();

    if (error) throw error;
    return NextResponse.json(toCamel(data));
  } catch (error) {
    console.error("PATCH /api/devis/[id]:", error);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }
}
