import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel, toSnake } from "@/lib/supabase";

const CACHE_HEADERS = { "Cache-Control": "private, max-age=30, stale-while-revalidate=59" };

export async function GET(req: NextRequest) {
  try {
    const stats = req.nextUrl.searchParams.get("stats");

    const upcoming = req.nextUrl.searchParams.get("upcoming");
    const limitParam = req.nextUrl.searchParams.get("limit");

    if (upcoming === "true") {
      const now = new Date().toISOString();
      const limit = limitParam ? parseInt(limitParam, 10) : 4;

      const { data, error } = await supabase
        .from("chantiers")
        .select("id, nom, adresse, date_debut")
        .not("statut", "in", '("ANNULE","TERMINE")')
        .gte("date_debut", now)
        .order("date_debut", { ascending: true })
        .limit(limit);

      if (error) throw error;

      const result = (data || []).map((c: any) => ({
        id: c.id,
        nom: c.nom,
        adresse: c.adresse,
        dateDebut: c.date_debut,
      }));

      return NextResponse.json(result, { headers: CACHE_HEADERS });
    }

    if (stats === "true") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [enCoursRes, totalRes, depensesMoisRes, devisRes, prospectsDevisRes] =
        await Promise.all([
          supabase
            .from("chantiers")
            .select("id", { count: "exact", head: true })
            .eq("statut", "EN_COURS"),
          supabase.from("chantiers").select("id", { count: "exact", head: true }),
          supabase
            .from("depenses")
            .select("montant")
            .gte("date", startOfMonth.toISOString()),
          supabase
            .from("chantiers")
            .select("id", { count: "exact", head: true })
            .eq("statut", "DEVIS_ENVOYE"),
          supabase
            .from("prospects")
            .select("id", { count: "exact", head: true })
            .eq("colonne", "ENVOI_DEVIS"),
        ]);

      const caMois = (depensesMoisRes.data || []).reduce(
        (sum: number, d: any) => sum + d.montant,
        0
      );

      return NextResponse.json({
        enCours: enCoursRes.count || 0,
        devisEnAttente: (devisRes.count || 0) + (prospectsDevisRes.count || 0),
        caMois,
        total: totalRes.count || 0,
      }, { headers: CACHE_HEADERS });
    }

    const { data: chantiers, error } = await supabase
      .from("chantiers")
      .select(`
        id, nom, adresse, type, surface, materiaux, description,
        statut, date_debut, date_fin, notes, chef_id, client_id, created_at,
        affectations:chantier_membres(
          id,
          membre:membres_equipe(id, nom, prenom, role)
        ),
        chef:membres_equipe!chef_id(id, nom, prenom),
        client:clients(id, nom, prenom, email, telephone),
        estimations(id, resultats_json, created_at),
        photos:photos_chantier(id, url, description, uploaded_at)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const result = (chantiers || []).map((c: any) => {
      const { photos, ...rest } = c as Record<string, unknown>;
      return {
        ...(toCamel(rest) as Record<string, unknown>),
        _count: { photos: (Array.isArray(photos) ? photos : []).length },
      };
    });

    return NextResponse.json(result, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error(error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data: chantier, error } = await supabase
      .from("chantiers")
      .insert({
        nom: body.nom,
        adresse: body.adresse,
        type: body.type || null,
        surface: body.surface ? parseFloat(body.surface) : null,
        materiaux: body.materiaux || null,
        description: body.description || null,
        date_debut: body.dateDebut ? new Date(body.dateDebut).toISOString() : null,
        date_fin: body.dateFin ? new Date(body.dateFin).toISOString() : null,
        statut: body.statut || "PROSPECT",
        chef_id: body.chefId || null,
        client_id: body.clientId || null,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(toCamel(chantier), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur création chantier" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (data.dateDebut) data.dateDebut = new Date(data.dateDebut).toISOString();
    if (data.dateFin) data.dateFin = new Date(data.dateFin).toISOString();

    const dbData = toSnake(data);
    dbData.updated_at = new Date().toISOString();

    const { data: chantier, error } = await supabase
      .from("chantiers")
      .update(dbData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(toCamel(chantier));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const { error } = await supabase.from("chantiers").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
