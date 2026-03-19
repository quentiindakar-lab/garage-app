import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel, toSnake } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      const { data: client, error } = await supabase
        .from("clients")
        .select(`
          *,
          chantiers(
            *,
            depenses(montant),
            estimations(id, resultats_json, created_at)
          ),
          prospects(
            *,
            actions:prospect_actions(id, type, contenu, sent_at)
          )
        `)
        .eq("id", id)
        .order("created_at", { referencedTable: "chantiers", ascending: false })
        .order("created_at", { referencedTable: "prospects", ascending: false })
        .single();

      if (error || !client)
        return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });

      const caTotal = (client.chantiers || []).reduce(
        (sum: number, ch: any) =>
          sum + (ch.depenses || []).reduce((s: number, d: any) => s + d.montant, 0),
        0
      );

      return NextResponse.json({ ...(toCamel(client) as Record<string, unknown>), caTotal });
    }

    const { data: clients, error } = await supabase
      .from("clients")
      .select(`
        *,
        chantiers(id, nom, statut, depenses(montant)),
        prospects(id, colonne)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const result = (clients || []).map((c: any) => ({
      ...(toCamel(c) as Record<string, unknown>),
      nbChantiers: (c.chantiers || []).length,
      caTotal: (c.chantiers || []).reduce(
        (sum: number, ch: any) =>
          sum + (ch.depenses || []).reduce((s: number, d: any) => s + d.montant, 0),
        0
      ),
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
    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        nom: body.nom,
        prenom: body.prenom || null,
        email: body.email || null,
        telephone: body.telephone || null,
        adresse: body.adresse || null,
        entreprise: body.entreprise || null,
        type_client: body.typeClient || "PARTICULIER",
        notes: body.notes || null,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(toCamel(client), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur création client" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const dbData = toSnake(data);
    dbData.updated_at = new Date().toISOString();

    const { data: client, error } = await supabase
      .from("clients")
      .update(dbData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(toCamel(client));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
