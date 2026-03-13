import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const stats = req.nextUrl.searchParams.get("stats");

    if (stats === "true") {
      const actifs = await prisma.membreEquipe.count({ where: { actif: true } });
      return NextResponse.json({ actifs });
    }

    const membres = await prisma.membreEquipe.findMany({
      include: {
        affectations: {
          include: { chantier: { select: { id: true, nom: true, statut: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = membres.map((m) => ({
      ...m,
      chantiersActuels: m.affectations
        .filter((a) => a.chantier.statut === "EN_COURS")
        .map((a) => ({ id: a.chantier.id, nom: a.chantier.nom })),
      chantiersPasses: m.affectations
        .filter((a) => a.chantier.statut === "TERMINE")
        .map((a) => ({ id: a.chantier.id, nom: a.chantier.nom })),
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
    const membre = await prisma.membreEquipe.create({
      data: {
        nom: body.nom,
        prenom: body.prenom || null,
        email: body.email || null,
        telephone: body.telephone || null,
        role: body.role || "Ouvrier",
        specialite: body.specialite || null,
      },
    });
    return NextResponse.json(membre, { status: 201 });
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
      const membre = await prisma.membreEquipe.findUnique({ where: { id } });
      if (!membre) return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });
      const updated = await prisma.membreEquipe.update({ where: { id }, data: { actif: !membre.actif } });
      return NextResponse.json(updated);
    }

    const updated = await prisma.membreEquipe.update({ where: { id }, data: rest });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await prisma.membreEquipe.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
