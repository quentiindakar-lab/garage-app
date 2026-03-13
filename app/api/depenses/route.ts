import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const stats = req.nextUrl.searchParams.get("stats");
    const chantierId = req.nextUrl.searchParams.get("chantierId");

    if (stats === "true") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [total, byCategory] = await Promise.all([
        prisma.depense.aggregate({
          _sum: { montant: true },
          where: { date: { gte: startOfMonth } },
        }),
        prisma.depense.groupBy({
          by: ["categorie"],
          _sum: { montant: true },
          where: { date: { gte: startOfMonth } },
        }),
      ]);

      return NextResponse.json({
        totalMois: total._sum.montant || 0,
        parCategorie: byCategory.map((c) => ({
          categorie: c.categorie,
          montant: c._sum.montant || 0,
        })),
      });
    }

    const where = chantierId ? { chantierId } : {};
    const depenses = await prisma.depense.findMany({
      where,
      include: { chantier: { select: { nom: true } } },
      orderBy: { date: "desc" },
    });

    const result = depenses.map((d) => ({
      id: d.id,
      montant: d.montant,
      date: d.date.toISOString().slice(0, 10),
      fournisseur: d.fournisseur || "",
      categorie: d.categorie,
      chantierId: d.chantierId || null,
      chantierNom: d.chantier?.nom || null,
      notes: d.notes,
      photoUrl: d.photoUrl,
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

    const CATEGORY_MAP: Record<string, string> = {
      Repas: "REPAS",
      Carburant: "CARBURANT",
      Matériaux: "MATERIAUX",
      Outillage: "OUTILLAGE",
      Transport: "TRANSPORT",
      Autre: "AUTRE",
    };

    const depense = await prisma.depense.create({
      data: {
        montant: parseFloat(body.montant) || 0,
        date: body.date ? new Date(body.date) : new Date(),
        fournisseur: body.fournisseur || null,
        categorie: (CATEGORY_MAP[body.categorie] || body.categorie || "AUTRE") as "REPAS" | "CARBURANT" | "MATERIAUX" | "OUTILLAGE" | "TRANSPORT" | "AUTRE",
        notes: body.notes || null,
        photoUrl: body.photoUrl || null,
        chantierId: body.chantierId || null,
      },
    });

    return NextResponse.json(depense, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur création dépense" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await prisma.depense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
