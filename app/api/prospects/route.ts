import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel, toSnake } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: prospects, error } = await supabase
      .from("prospects")
      .select("id, nom, email, telephone, type_chantier, notes, colonne, client_id, created_at, actions:prospect_actions(id, type, contenu, sent_at)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const result = (prospects || []).map((p: any) => {
      const camelP = toCamel(p) as any;
      if (camelP.actions) {
        camelP.actions = [...camelP.actions]
          .sort(
            (a: any, b: any) =>
              new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
          )
          .slice(0, 5);
      }
      return camelP;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data: prospect, error } = await supabase
      .from("prospects")
      .insert({
        nom: body.nom,
        email: body.email || null,
        telephone: body.telephone || null,
        type_chantier: body.typeChantier || null,
        notes: body.notes || null,
        colonne: body.colonne || "TOUS_PROSPECTS",
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(toCamel(prospect), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur création prospect" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, colonne, ...rest } = body;

    const { data: currentProspect } = await supabase
      .from("prospects")
      .select("id, nom, email, telephone, type_chantier, client_id")
      .eq("id", id)
      .single();

    if (!currentProspect)
      return NextResponse.json({ error: "Prospect non trouvé" }, { status: 404 });

    let clientId = currentProspect.client_id;

    if (colonne === "GAGNE" && !clientId) {
      const { data: client } = await supabase
        .from("clients")
        .insert({
          nom: currentProspect.nom,
          email: currentProspect.email,
          telephone: currentProspect.telephone,
          type_client: "PARTICULIER",
          notes: `Converti depuis prospect CRM. Type chantier: ${currentProspect.type_chantier || "N/A"}`,
        })
        .select()
        .single();
      clientId = client?.id;
    }

    const dbRest = toSnake(rest);
    const updateData: Record<string, unknown> = {
      ...dbRest,
      colonne,
      client_id: clientId,
      updated_at: new Date().toISOString(),
    };

    const { data: prospect, error } = await supabase
      .from("prospects")
      .update(updateData)
      .eq("id", id)
      .select("id, nom, email, telephone, type_chantier, notes, colonne, client_id, created_at, client:clients(id, nom, prenom)")
      .single();

    if (error) throw error;

    if (colonne) {
      await supabase.from("prospect_actions").insert({
        prospect_id: id,
        type: `MOVED_TO_${colonne}`,
        contenu:
          colonne === "GAGNE"
            ? "Prospect gagné — client créé automatiquement"
            : `Déplacé vers ${colonne}`,
      });
    }

    return NextResponse.json(toCamel(prospect));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const { error } = await supabase.from("prospects").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
