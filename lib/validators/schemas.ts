import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const chantierSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  adresse: z.string().min(3, "L'adresse est requise"),
  type: z.string().optional(),
  surface: z.number().positive("La surface doit être positive").optional(),
  materiaux: z.string().optional(),
  description: z.string().optional(),
  dateDebut: z.string().datetime().optional().or(z.literal("")),
  dateFin: z.string().datetime().optional().or(z.literal("")),
  chefId: z.string().cuid().optional(),
});

export const prospectSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().optional(),
  typeChantier: z.string().optional(),
  notes: z.string().optional(),
});

export const membreSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().optional(),
  role: z.string().optional(),
  specialite: z.string().optional(),
});

export const depenseSchema = z.object({
  montant: z.number().positive("Le montant doit être positif"),
  date: z.string().optional(),
  fournisseur: z.string().optional(),
  categorie: z.enum(["REPAS", "CARBURANT", "MATERIAUX", "OUTILLAGE", "TRANSPORT", "AUTRE"]).optional(),
  chantierId: z.string().cuid().optional(),
  notes: z.string().optional(),
});

export const estimationSchema = z.object({
  nom: z.string().optional(),
  adresse: z.string().optional(),
  surface: z.number().positive().optional(),
  metiers: z.array(z.string()).optional(),
  materiaux: z.string().optional(),
  localisation: z.string().optional(),
  delaiSouhaite: z.number().int().positive().optional(),
  margePercent: z.number().min(10).max(50).optional(),
  description: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChantierInput = z.infer<typeof chantierSchema>;
export type ProspectInput = z.infer<typeof prospectSchema>;
export type MembreInput = z.infer<typeof membreSchema>;
export type DepenseInput = z.infer<typeof depenseSchema>;
export type EstimationInput = z.infer<typeof estimationSchema>;
