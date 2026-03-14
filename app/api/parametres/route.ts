import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: "singleton", tva: 20, margeDefaut: 15 },
      });
    }
    return NextResponse.json(settings);
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
    if (data.smtpPort !== undefined) data.smtpPort = data.smtpPort ? parseInt(data.smtpPort) : null;

    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", ...data },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur sauvegarde" }, { status: 500 });
  }
}
