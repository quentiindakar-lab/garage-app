import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ActivityItem {
  type: string;
  title: string;
  description: string;
  entityId: string;
  href: string;
  createdAt: Date;
}

export async function GET() {
  try {
    const [chantiers, clients, prospectActions, depenses] = await Promise.all([
      prisma.chantier.findMany({
        select: { id: true, nom: true, adresse: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.client.findMany({
        select: { id: true, nom: true, prenom: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.prospectAction.findMany({
        select: { id: true, type: true, contenu: true, sentAt: true, prospect: { select: { id: true, nom: true } } },
        orderBy: { sentAt: "desc" },
        take: 5,
      }),
      prisma.depense.findMany({
        select: { id: true, montant: true, fournisseur: true, createdAt: true, chantier: { select: { id: true, nom: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const activities: ActivityItem[] = [
      ...chantiers.map((c) => ({
        type: "chantier",
        title: "Chantier créé",
        description: `${c.nom} — ${c.adresse}`,
        entityId: c.id,
        href: `/admin/chantiers/${c.id}`,
        createdAt: c.createdAt,
      })),
      ...clients.map((c) => ({
        type: "client",
        title: "Client ajouté",
        description: `${c.nom} ${c.prenom || ""}`.trim(),
        entityId: c.id,
        href: `/admin/clients/${c.id}`,
        createdAt: c.createdAt,
      })),
      ...prospectActions.map((a) => ({
        type: "prospect",
        title: a.type.startsWith("MOVED_TO_GAGNE") ? "Prospect gagné" : "Prospect déplacé",
        description: `${a.prospect.nom} — ${a.contenu || a.type}`,
        entityId: a.prospect.id,
        href: "/admin/crm",
        createdAt: a.sentAt,
      })),
      ...depenses.map((d) => ({
        type: "depense",
        title: "Dépense enregistrée",
        description: `${d.fournisseur || "Fournisseur"} — ${d.montant.toFixed(2)} €${d.chantier ? ` (${d.chantier.nom})` : ""}`,
        entityId: d.id,
        href: d.chantier ? `/admin/chantiers/${d.chantier.id}` : "/admin/bilan",
        createdAt: d.createdAt,
      })),
    ];

    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json(activities.slice(0, 10));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
