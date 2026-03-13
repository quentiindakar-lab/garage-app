import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          chantiers: {
            include: {
              depenses: { select: { montant: true } },
              estimations: { select: { id: true, resultatsJson: true, createdAt: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          prospects: {
            include: { actions: { orderBy: { sentAt: "desc" }, take: 3 } },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!client) return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });

      const caTotal = client.chantiers.reduce((sum, ch) => {
        return sum + ch.depenses.reduce((s, d) => s + d.montant, 0);
      }, 0);

      return NextResponse.json({ ...client, caTotal });
    }

    const clients = await prisma.client.findMany({
      include: {
        chantiers: {
          select: { id: true, nom: true, statut: true, depenses: { select: { montant: true } } },
        },
        prospects: { select: { id: true, colonne: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = clients.map((c) => ({
      ...c,
      nbChantiers: c.chantiers.length,
      caTotal: c.chantiers.reduce(
        (sum, ch) => sum + ch.depenses.reduce((s, d) => s + d.montant, 0),
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
    const client = await prisma.client.create({
      data: {
        nom: body.nom,
        prenom: body.prenom || null,
        email: body.email || null,
        telephone: body.telephone || null,
        adresse: body.adresse || null,
        entreprise: body.entreprise || null,
        typeClient: body.typeClient || "PARTICULIER",
        notes: body.notes || null,
      },
    });
    return NextResponse.json(client, { status: 201 });
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
    const client = await prisma.client.update({ where: { id }, data });
    return NextResponse.json(client);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
