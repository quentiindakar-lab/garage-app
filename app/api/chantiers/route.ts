import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const stats = req.nextUrl.searchParams.get("stats");

    if (stats === "true") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [enCours, total, depensesMois, devisEnAttente, prospectsDevis] = await Promise.all([
        prisma.chantier.count({ where: { statut: "EN_COURS" } }),
        prisma.chantier.count(),
        prisma.depense.aggregate({
          _sum: { montant: true },
          where: { date: { gte: startOfMonth } },
        }),
        prisma.chantier.count({ where: { statut: "DEVIS_ENVOYE" } }),
        prisma.prospect.count({ where: { colonne: "ENVOI_DEVIS" } }),
      ]);
      return NextResponse.json({
        enCours,
        devisEnAttente: devisEnAttente + prospectsDevis,
        caMois: depensesMois._sum.montant || 0,
        total,
      });
    }

    const chantiers = await prisma.chantier.findMany({
      include: {
        affectations: {
          include: { membre: { select: { nom: true, prenom: true, role: true } } },
        },
        chef: { select: { nom: true, prenom: true } },
        client: { select: { id: true, nom: true, prenom: true, email: true, telephone: true } },
        estimations: { select: { id: true, resultatsJson: true, createdAt: true } },
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(chantiers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chantier = await prisma.chantier.create({
      data: {
        nom: body.nom,
        adresse: body.adresse,
        type: body.type || null,
        surface: body.surface ? parseFloat(body.surface) : null,
        materiaux: body.materiaux || null,
        description: body.description || null,
        dateDebut: body.dateDebut ? new Date(body.dateDebut) : null,
        dateFin: body.dateFin ? new Date(body.dateFin) : null,
        statut: body.statut || "PROSPECT",
        chefId: body.chefId || null,
        clientId: body.clientId || null,
      },
    });
    return NextResponse.json(chantier, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur création chantier" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (data.dateDebut) data.dateDebut = new Date(data.dateDebut);
    if (data.dateFin) data.dateFin = new Date(data.dateFin);
    const chantier = await prisma.chantier.update({ where: { id }, data });
    return NextResponse.json(chantier);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await prisma.chantier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
