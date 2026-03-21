import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 30;

interface ActivityItem {
  type: string;
  title: string;
  description: string;
  entityId: string;
  href: string;
  createdAt: string;
}

export async function GET() {
  try {
    const [chantiersRes, clientsRes, actionsRes, depensesRes] = await Promise.all([
      supabase
        .from("chantiers")
        .select("id, nom, adresse, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("clients")
        .select("id, nom, prenom, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("prospect_actions")
        .select("id, type, contenu, sent_at, prospect:prospects(id, nom)")
        .order("sent_at", { ascending: false })
        .limit(5),
      supabase
        .from("depenses")
        .select("id, montant, fournisseur, created_at, chantier:chantiers(id, nom)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const chantiers = chantiersRes.data || [];
    const clients = clientsRes.data || [];
    const prospectActions = actionsRes.data || [];
    const depenses = depensesRes.data || [];

    const activities: ActivityItem[] = [
      ...chantiers.map((c: any) => ({
        type: "chantier",
        title: "Chantier créé",
        description: `${c.nom} — ${c.adresse}`,
        entityId: c.id,
        href: `/admin/chantiers/${c.id}`,
        createdAt: c.created_at,
      })),
      ...clients.map((c: any) => ({
        type: "client",
        title: "Client ajouté",
        description: `${c.nom} ${c.prenom || ""}`.trim(),
        entityId: c.id,
        href: `/admin/clients/${c.id}`,
        createdAt: c.created_at,
      })),
      ...prospectActions.map((a: any) => ({
        type: "prospect",
        title: a.type.startsWith("MOVED_TO_GAGNE") ? "Prospect gagné" : "Prospect déplacé",
        description: `${a.prospect?.nom || "Inconnu"} — ${a.contenu || a.type}`,
        entityId: a.prospect?.id || a.id,
        href: "/admin/crm",
        createdAt: a.sent_at,
      })),
      ...depenses.map((d: any) => ({
        type: "depense",
        title: "Dépense enregistrée",
        description: `${d.fournisseur || "Fournisseur"} — ${d.montant.toFixed(2)} €${d.chantier ? ` (${d.chantier.nom})` : ""}`,
        entityId: d.id,
        href: d.chantier ? `/admin/chantiers/${d.chantier.id}` : "/admin/bilan",
        createdAt: d.created_at,
      })),
    ];

    activities.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(activities.slice(0, 10));
  } catch (error) {
    console.error(error);
    return NextResponse.json([]);
  }
}
