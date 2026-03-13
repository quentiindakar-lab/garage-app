import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { BTP_CONFIG } from "@/config/btp.config";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
