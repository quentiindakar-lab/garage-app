import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel, toSnake } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const stats = req.nextUrl.searchParams.get("stats");

    if (stats === "true") {
      const { count } = await supabase
        .from("membres_equipe")
        .select("id", { count: "exact", head: true })
        .eq("actif", true);
      return NextResponse.json({ actifs: count || 0 });
    }

    const { data: membres, error } = await supabase
      .from("membres_equipe")
      .select(`
        id, nom, prenom, role, telephone, email, actif, specialite, created_at,
        affectations:chantier_membres(
          id,
          chantier:chantiers(id, nom, statut)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const result = (membres || []).map((m: any) => ({
      ...(toCamel(m) as Record<string, unknown>),
      chantiersActuels: (m.affectations || [])
        .filter((a: any) => a.chantier?.statut === "EN_COURS")
        .map((a: any) => ({ id: a.chantier.id, nom: a.chantier.nom })),
      chantiersPasses: (m.affectations || [])
        .filter((a: any) => a.chantier?.statut === "TERMINE")
        .map((a: any) => ({ id: a.chantier.id, nom: a.chantier.nom })),
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
    const { data: membre, error } = await supabase
      .from("membres_equipe")
      .insert({
        nom: body.nom,
        prenom: body.prenom || null,
        email: body.email || null,
        telephone: body.telephone || null,
        role: body.role || "Ouvrier",
        specialite: body.specialite || null,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(toCamel(membre), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur création membre" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, toggleActif, ...rest } = body;

    if (toggleActif) {
      const { data: membre } = await supabase
        .from("membres_equipe")
        .select("actif")
        .eq("id", id)
        .single();
      if (!membre)
        return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });

      const { data: updated, error } = await supabase
        .from("membres_equipe")
        .update({ actif: !membre.actif, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(toCamel(updated));
    }

    const dbData = toSnake(rest);
    dbData.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("membres_equipe")
      .update(dbData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(toCamel(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const { error } = await supabase.from("membres_equipe").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
