import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: fr });
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: fr });
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function generateToken(): string {
  return crypto.randomUUID();
}

export function calcTTC(ht: number, tauxTVA: number): number {
  return Math.round(ht * (1 + tauxTVA) * 100) / 100;
}

export function calcTVA(ht: number, tauxTVA: number): number {
  return Math.round(ht * tauxTVA * 100) / 100;
}
