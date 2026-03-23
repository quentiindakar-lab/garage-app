import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const stats = req.nextUrl.searchParams.get("stats");
    const chantierId = req.nextUrl.searchParams.get("chantierId");

    if (stats === "true") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data: depensesMois } = await supabase
        .from("depenses")
        .select("montant, categorie")
        .gte("date", startOfMonth.toISOString());

      const totalMois = (depensesMois || []).reduce(
        (sum: number, d: any) => sum + d.montant,
        0
      );

      const categorieMap = new Map<string, number>();
      for (const d of depensesMois || []) {
        categorieMap.set(
          d.categorie,
          (categorieMap.get(d.categorie) || 0) + d.montant
        );
      }

      return NextResponse.json({
        totalMois,
        parCategorie: Array.from(categorieMap.entries()).map(
          ([categorie, montant]) => ({ categorie, montant })
        ),
      });
    }

    let query = supabase
      .from("depenses")
      .select("id, montant, date, fournisseur, categorie, chantier_id, notes, photo_url, chantier:chantiers(nom)")
      .order("date", { ascending: false })
      .limit(50);

    if (chantierId) query = query.eq("chantier_id", chantierId);

    const { data: depenses, error } = await query;
    if (error) throw error;

    const result = (depenses || []).map((d: any) => ({
      id: d.id,
      montant: d.montant,
      date: new Date(d.date).toISOString().slice(0, 10),
      fournisseur: d.fournisseur || "",
      categorie: d.categorie,
      chantierId: d.chantier_id || null,
      chantierNom: d.chantier?.nom || null,
      notes: d.notes,
      photoUrl: d.photo_url,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const CATEGORY_MAP: Record<string, string> = {
      Repas: "REPAS",
      Carburant: "CARBURANT",
      "Matériaux": "MATERIAUX",
      Outillage: "OUTILLAGE",
      Transport: "TRANSPORT",
      Autre: "AUTRE",
    };

    const { data: depense, error } = await supabase
      .from("depenses")
      .insert({
        montant: parseFloat(body.montant) || 0,
        date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
        fournisseur: body.fournisseur || null,
        categorie: CATEGORY_MAP[body.categorie] || body.categorie || "AUTRE",
        notes: body.notes || null,
        photo_url: body.photoUrl || null,
        chantier_id: body.chantierId || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(toCamel(depense), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur création dépense" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const { error } = await supabase.from("depenses").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
