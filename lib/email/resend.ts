import { Resend } from "resend";
import { BTP_CONFIG } from "@/config/btp.config";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function envoyerEmail({ to, subject, html }: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email simulé] À: ${to} | Sujet: ${subject}`);
    return { id: "simulated" };
  }

  const { data, error } = await getResend().emails.send({
    from: `${BTP_CONFIG.nom} <noreply@${BTP_CONFIG.email.split("@")[1]}>`,
    to,
    subject,
    html: wrapEmailTemplate(html),
  });

  if (error) throw new Error(error.message);
  return data;
}

function wrapEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: ${BTP_CONFIG.couleurSecondaire}; padding: 24px; text-align: center; }
    .header h1 { color: ${BTP_CONFIG.couleurPrimaire}; margin: 0; font-size: 22px; }
    .header p { color: #94a3b8; margin: 4px 0 0; font-size: 13px; }
    .content { padding: 32px 24px; color: #1e293b; line-height: 1.6; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-block; padding: 14px 28px; background: ${BTP_CONFIG.couleurPrimaire}; color: #0f172a; text-decoration: none; border-radius: 8px; font-weight: 700; }
    .highlight { background: #fffbeb; border-left: 4px solid ${BTP_CONFIG.couleurPrimaire}; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { text-align: left; padding: 8px 12px; background: #f8fafc; font-size: 13px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${BTP_CONFIG.nom}</h1>
      <p>${BTP_CONFIG.slogan}</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>${BTP_CONFIG.nom}</strong> — ${BTP_CONFIG.adresse}</p>
      <p>${BTP_CONFIG.telephone} | ${BTP_CONFIG.email}</p>
      <p>SIRET : ${BTP_CONFIG.siret}</p>
    </div>
  </div>
</body>
</html>`;
}

export function templateDevisChantier(data: {
  nom: string;
  chantier: string;
  montantHT: string;
  montantTTC: string;
  validiteJours: number;
  lienDevis: string;
}) {
  return `
    <h2>Votre devis est prêt</h2>
    <p>Bonjour ${data.nom},</p>
    <p>Suite à votre demande, nous avons le plaisir de vous transmettre notre devis pour le chantier <strong>${data.chantier}</strong>.</p>
    <div class="highlight">
      <p style="margin:0"><strong>Montant HT :</strong> ${data.montantHT}</p>
      <p style="margin:4px 0 0"><strong>Montant TTC :</strong> ${data.montantTTC}</p>
    </div>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${data.lienDevis}" class="btn">Consulter le devis</a>
    </p>
    <p>Ce devis est valable <strong>${data.validiteJours} jours</strong>.</p>
    <p>N'hésitez pas à nous contacter pour toute question.</p>
    <p>Cordialement,<br>L'équipe ${BTP_CONFIG.nom}</p>
  `;
}

export function templateRelanceProspect(data: {
  nom: string;
  chantier: string;
  numRelance: number;
}) {
  return `
    <h2>Où en êtes-vous ?</h2>
    <p>Bonjour ${data.nom},</p>
    <p>Nous revenons vers vous concernant notre proposition pour <strong>${data.chantier}</strong>.</p>
    <p>Notre devis est toujours valable et nous serions ravis de pouvoir démarrer les travaux dans les meilleurs délais.</p>
    <p>Si vous avez des questions ou souhaitez ajuster certains éléments, nous restons à votre disposition.</p>
    <p>Cordialement,<br>L'équipe ${BTP_CONFIG.nom}</p>
  `;
}

export function templateSuiviChantier(data: {
  nom: string;
  chantier: string;
  statut: string;
  message?: string;
}) {
  return `
    <h2>Mise à jour de votre chantier</h2>
    <p>Bonjour ${data.nom},</p>
    <p>Voici une mise à jour concernant votre chantier <strong>${data.chantier}</strong> :</p>
    <div class="highlight">
      <p style="margin:0"><strong>Statut :</strong> ${data.statut}</p>
    </div>
    ${data.message ? `<p>${data.message}</p>` : ""}
    <p>Cordialement,<br>L'équipe ${BTP_CONFIG.nom}</p>
  `;
}

export function templateFinChantier(data: {
  nom: string;
  chantier: string;
}) {
  return `
    <h2>Chantier terminé !</h2>
    <p>Bonjour ${data.nom},</p>
    <p>Nous avons le plaisir de vous informer que le chantier <strong>${data.chantier}</strong> est désormais terminé.</p>
    <p>Nous espérons que les travaux vous donnent entière satisfaction. N'hésitez pas à nous contacter pour tout retour.</p>
    <p>Merci pour votre confiance !</p>
    <p>Cordialement,<br>L'équipe ${BTP_CONFIG.nom}</p>
  `;
}
