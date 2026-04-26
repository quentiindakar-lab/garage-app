import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from("photos_chantier")
      .select("id, url, description, uploaded_at")
      .eq("chantier_id", params.id)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json((data || []).map(toCamel));
  } catch (error) {
    console.error("GET /api/chantiers/[id]/photos:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { url, description } = await req.json();
    if (!url) return NextResponse.json({ error: "URL requise" }, { status: 400 });

    const { data, error } = await supabase
      .from("photos_chantier")
      .insert({
        chantier_id: params.id,
        url,
        description: description || null,
        uploaded_at: new Date().toISOString(),
      })
      .select("id, url, description, uploaded_at")
      .single();

    if (error) throw error;
    return NextResponse.json(toCamel(data), { status: 201 });
  } catch (error) {
    console.error("POST /api/chantiers/[id]/photos:", error);
    return NextResponse.json({ error: "Erreur enregistrement photo" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get("photoId");
    if (!photoId) return NextResponse.json({ error: "photoId requis" }, { status: 400 });

    const { error } = await supabase
      .from("photos_chantier")
      .delete()
      .eq("id", photoId)
      .eq("chantier_id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/chantiers/[id]/photos:", error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
