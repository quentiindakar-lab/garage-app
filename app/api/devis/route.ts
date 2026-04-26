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

async function genNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("devis")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
    .lt("created_at", `${year + 1}-01-01`);
  const seq = String((count || 0) + 1).padStart(3, "0");
  return `DEV-${year}-${seq}`;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("devis")
      .select("id, numero, statut, client_nom, client_email, total_ttc, date_emission, date_validite, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json((data || []).map((d: any) => toCamel(d)));
  } catch (error) {
    console.error("GET /api/devis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lignes = Array.isArray(body.lignes) ? body.lignes : [];
    const { totalHt, tvaMontant, totalTtc } = calcTotals(lignes);
    const numero = await genNumero();

    const { data, error } = await supabase
      .from("devis")
      .insert({
        numero,
        statut: body.statut || "brouillon",
        client_id: body.clientId || null,
        prospect_id: body.prospectId || null,
        client_nom: body.clientNom,
        client_email: body.clientEmail || null,
        client_telephone: body.clientTelephone || null,
        client_adresse: body.clientAdresse || null,
        chantier_adresse: body.chantierAdresse || null,
        date_emission: body.dateEmission || new Date().toISOString().slice(0, 10),
        date_validite: body.dateValidite || null,
        lignes,
        total_ht: totalHt,
        tva_montant: tvaMontant,
        total_ttc: totalTtc,
        acompte_pourcentage: body.acomptePourcentage ?? 30,
        conditions_paiement: body.conditionsPaiement || "30% à la signature, solde à la fin des travaux",
        notes: body.notes || null,
        mention_dechets: body.mentionDechets || "Conformément à la loi du 10/02/2020, les déchets de chantier seront évacués et traités dans des filières agréées.",
      })
      .select("id, numero, statut, client_nom, total_ttc, date_emission, date_validite, created_at")
      .single();

    if (error) throw error;
    return NextResponse.json(toCamel(data), { status: 201 });
  } catch (error) {
    console.error("POST /api/devis:", error);
    return NextResponse.json({ error: "Erreur création devis" }, { status: 500 });
  }
}
