import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { BTP_CONFIG } from "@/config/btp.config";

export const metadata: Metadata = {
  title: `${BTP_CONFIG.nom} — ${BTP_CONFIG.slogan}`,
  description: `${BTP_CONFIG.nom} - Gestion de chantiers BTP à ${BTP_CONFIG.ville}. Estimation IA, CRM, planning et suivi financier.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={GeistSans.className} suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
