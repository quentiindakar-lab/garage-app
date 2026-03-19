import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel, toSnake } from "@/lib/supabase";

export async function GET() {
  try {
    let { data: settings } = await supabase
      .from("settings")
      .select("*")
      .eq("id", "singleton")
      .single();

    if (!settings) {
      const { data } = await supabase
        .from("settings")
        .insert({ id: "singleton", tva: 20, marge_defaut: 15 })
        .select()
        .single();
      settings = data;
    }

    return NextResponse.json(toCamel(settings));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id: _id, ...data } = body;

    if (data.tva !== undefined) data.tva = parseFloat(data.tva);
    if (data.margeDefaut !== undefined) data.margeDefaut = parseFloat(data.margeDefaut);
    if (data.smtpPort !== undefined)
      data.smtpPort = data.smtpPort ? parseInt(data.smtpPort) : null;

    const dbData = toSnake(data);

    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .eq("id", "singleton")
      .single();

    let settings;
    if (existing) {
      const { data: updated, error } = await supabase
        .from("settings")
        .update(dbData)
        .eq("id", "singleton")
        .select()
        .single();
      if (error) throw error;
      settings = updated;
    } else {
      const { data: created, error } = await supabase
        .from("settings")
        .insert({ id: "singleton", ...dbData })
        .select()
        .single();
      if (error) throw error;
      settings = created;
    }

    return NextResponse.json(toCamel(settings));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur sauvegarde" }, { status: 500 });
  }
}
