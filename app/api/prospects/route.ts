import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prospects = await prisma.prospect.findMany({
      include: { actions: { orderBy: { sentAt: "desc" }, take: 5 } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(prospects);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prospect = await prisma.prospect.create({
      data: {
        nom: body.nom,
        email: body.email || null,
        telephone: body.telephone || null,
        typeChantier: body.typeChantier || null,
        notes: body.notes || null,
        colonne: "TOUS_PROSPECTS",
      },
    });
    return NextResponse.json(prospect, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur création prospect" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, colonne, ...rest } = body;

    const currentProspect = await prisma.prospect.findUnique({ where: { id } });
    if (!currentProspect) return NextResponse.json({ error: "Prospect non trouvé" }, { status: 404 });

    let clientId = currentProspect.clientId;

    if (colonne === "GAGNE" && !clientId) {
      const client = await prisma.client.create({
        data: {
          nom: currentProspect.nom,
          email: currentProspect.email,
          telephone: currentProspect.telephone,
          typeClient: "PARTICULIER",
          notes: `Converti depuis prospect CRM. Type chantier: ${currentProspect.typeChantier || "N/A"}`,
        },
      });
      clientId = client.id;
    }

    const prospect = await prisma.prospect.update({
      where: { id },
      data: { colonne, clientId, ...rest },
      include: { client: true },
    });

    if (colonne) {
      await prisma.prospectAction.create({
        data: {
          prospectId: id,
          type: `MOVED_TO_${colonne}`,
          contenu: colonne === "GAGNE"
            ? `Prospect gagné — client créé automatiquement`
            : `Déplacé vers ${colonne}`,
        },
      });
    }

    return NextResponse.json(prospect);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await prisma.prospect.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
