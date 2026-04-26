import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.registerHyphenationCallback((word) => [word]);

const GREEN = "#4a7c59";
const LIGHT_GREY = "#f5f5f0";
const GREY = "#888880";
const BLACK = "#1a1a1a";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: BLACK, paddingHorizontal: 36, paddingVertical: 36, backgroundColor: "#ffffff" },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  companyBlock: { flex: 1 },
  companyName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: GREEN, marginBottom: 2 },
  companyInfo: { fontSize: 8, color: GREY, lineHeight: 1.5 },
  devisBlock: { alignItems: "flex-end" },
  devisTitre: { fontSize: 22, fontFamily: "Helvetica-Bold", color: GREEN, marginBottom: 4 },
  devisNumero: { fontSize: 9, color: GREY },
  // Separator
  separator: { borderBottomWidth: 1, borderBottomColor: "#e8e8e2", marginBottom: 16 },
  // Client + Chantier
  infoRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  infoBlock: { flex: 1 },
  infoTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: GREEN, textTransform: "uppercase", marginBottom: 4 },
  infoText: { fontSize: 8.5, lineHeight: 1.5, color: BLACK },
  // Table
  tableHeader: { flexDirection: "row", backgroundColor: GREEN, paddingVertical: 5, paddingHorizontal: 4, borderRadius: 3, marginBottom: 2 },
  tableHeaderText: { color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold" },
  tableRow: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#f0f0eb" },
  tableRowAlt: { backgroundColor: LIGHT_GREY },
  tableCell: { fontSize: 8.5, color: BLACK },
  colDesc: { flex: 3 },
  colQty: { width: 30, textAlign: "right" },
  colUnit: { width: 35, textAlign: "center" },
  colPhu: { width: 50, textAlign: "right" },
  colTva: { width: 35, textAlign: "center" },
  colTtc: { width: 55, textAlign: "right" },
  // Totals
  totalsBlock: { alignItems: "flex-end", marginTop: 12, marginBottom: 16 },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginBottom: 2 },
  totalLabel: { fontSize: 8.5, color: GREY, width: 90, textAlign: "right" },
  totalValue: { fontSize: 8.5, width: 70, textAlign: "right" },
  totalTtcLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: BLACK, width: 90, textAlign: "right" },
  totalTtcValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: GREEN, width: 70, textAlign: "right" },
  // Conditions
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: GREEN, textTransform: "uppercase", marginBottom: 4 },
  sectionText: { fontSize: 8, color: GREY, lineHeight: 1.6, marginBottom: 8 },
  // Signature
  signatureBlock: { marginTop: 24, flexDirection: "row", gap: 20 },
  signatureBox: { flex: 1, borderWidth: 1, borderColor: "#e8e8e2", borderRadius: 4, padding: 10, minHeight: 60 },
  signatureTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: BLACK, marginBottom: 4 },
  signatureSubtext: { fontSize: 7.5, color: GREY },
  // Footer
  footer: { position: "absolute", bottom: 18, left: 36, right: 36, borderTopWidth: 1, borderTopColor: "#e8e8e2", paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: GREY },
});

const _fmtNum = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmt(n: number) {
  return _fmtNum.format(n) + "\u00a0€";
}

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

interface Ligne {
  description: string;
  quantite: number;
  unite: string;
  prixUnitaireHt: number;
  tvaTaux: string | number;
  totalHt?: number;
  totalTtc?: number;
}

interface DevisData {
  numero: string;
  statut: string;
  clientNom: string;
  clientEmail?: string;
  clientTelephone?: string;
  clientAdresse?: string;
  chantierAdresse?: string;
  dateEmission: string;
  dateValidite: string;
  lignes: Ligne[];
  totalHt: number;
  tvaMontant: number;
  totalTtc: number;
  acomptePourcentage: number;
  conditionsPaiement?: string;
  notes?: string;
  mentionDechets?: string;
}

interface EntrepriseData {
  nomEntreprise?: string;
  adresse?: string;
  siret?: string;
  telephone?: string;
  email?: string;
  assuranceDecennale?: string;
}

interface Props {
  devis: DevisData;
  entreprise: EntrepriseData;
}

export function DevisPDF({ devis, entreprise }: Props) {
  const lignes: Ligne[] = Array.isArray(devis.lignes) ? devis.lignes : [];

  const tvaParTaux: Record<string, number> = {};
  for (const l of lignes) {
    const key = String(l.tvaTaux);
    if (key === "exempt") continue;
    const ht = (l.quantite || 0) * (l.prixUnitaireHt || 0);
    const tva = ht * ((parseFloat(key) || 0) / 100);
    tvaParTaux[key] = (tvaParTaux[key] || 0) + tva;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* EN-TÊTE */}
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{entreprise.nomEntreprise || "Votre Entreprise BTP"}</Text>
            {entreprise.adresse && <Text style={styles.companyInfo}>{entreprise.adresse}</Text>}
            {entreprise.siret && <Text style={styles.companyInfo}>SIRET : {entreprise.siret}</Text>}
            {entreprise.telephone && <Text style={styles.companyInfo}>Tél : {entreprise.telephone}</Text>}
            {entreprise.email && <Text style={styles.companyInfo}>{entreprise.email}</Text>}
            {entreprise.assuranceDecennale && (
              <Text style={styles.companyInfo}>Assurance décennale : {entreprise.assuranceDecennale}</Text>
            )}
          </View>
          <View style={styles.devisBlock}>
            <Text style={styles.devisTitre}>DEVIS</Text>
            <Text style={styles.devisNumero}>{devis.numero}</Text>
            <Text style={[styles.devisNumero, { marginTop: 4 }]}>Émis le : {fmtDate(devis.dateEmission)}</Text>
            <Text style={styles.devisNumero}>Valable jusqu&apos;au : {fmtDate(devis.dateValidite)}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* DESTINATAIRE + CHANTIER */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Destinataire</Text>
            <Text style={styles.infoText}>{devis.clientNom}</Text>
            {devis.clientAdresse && <Text style={styles.infoText}>{devis.clientAdresse}</Text>}
            {devis.clientEmail && <Text style={styles.infoText}>{devis.clientEmail}</Text>}
            {devis.clientTelephone && <Text style={styles.infoText}>{devis.clientTelephone}</Text>}
          </View>
          {devis.chantierAdresse && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoTitle}>Adresse du chantier</Text>
              <Text style={styles.infoText}>{devis.chantierAdresse}</Text>
            </View>
          )}
        </View>

        {/* TABLEAU PRESTATIONS */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
          <Text style={[styles.tableHeaderText, styles.colUnit]}>Unité</Text>
          <Text style={[styles.tableHeaderText, styles.colPhu]}>Prix HT</Text>
          <Text style={[styles.tableHeaderText, styles.colTva]}>TVA</Text>
          <Text style={[styles.tableHeaderText, styles.colTtc]}>Total TTC</Text>
        </View>
        {lignes.map((l, i) => {
          const ht = (l.quantite || 0) * (l.prixUnitaireHt || 0);
          const tvaRate = l.tvaTaux === "exempt" ? 0 : parseFloat(String(l.tvaTaux)) || 0;
          const ttc = ht * (1 + tvaRate / 100);
          return (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.colDesc]}>{l.description}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{l.quantite}</Text>
              <Text style={[styles.tableCell, styles.colUnit]}>{l.unite}</Text>
              <Text style={[styles.tableCell, styles.colPhu]}>{fmt(l.prixUnitaireHt)}</Text>
              <Text style={[styles.tableCell, styles.colTva]}>
                {l.tvaTaux === "exempt" ? "Exo." : `${l.tvaTaux}%`}
              </Text>
              <Text style={[styles.tableCell, styles.colTtc]}>{fmt(ttc)}</Text>
            </View>
          );
        })}

        {/* TOTAUX */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{fmt(devis.totalHt)}</Text>
          </View>
          {Object.entries(tvaParTaux).map(([taux, montant]) => (
            <View key={taux} style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA {taux}%</Text>
              <Text style={styles.totalValue}>{fmt(montant)}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, { marginTop: 4 }]}>
            <Text style={styles.totalTtcLabel}>TOTAL TTC</Text>
            <Text style={styles.totalTtcValue}>{fmt(devis.totalTtc)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Acompte {devis.acomptePourcentage}%</Text>
            <Text style={styles.totalValue}>{fmt(devis.totalTtc * (devis.acomptePourcentage / 100))}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* CONDITIONS */}
        {devis.conditionsPaiement && (
          <>
            <Text style={styles.sectionTitle}>Conditions de paiement</Text>
            <Text style={styles.sectionText}>{devis.conditionsPaiement}</Text>
          </>
        )}
        {devis.mentionDechets && (
          <>
            <Text style={styles.sectionTitle}>Gestion des déchets</Text>
            <Text style={styles.sectionText}>{devis.mentionDechets}</Text>
          </>
        )}
        {devis.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.sectionText}>{devis.notes}</Text>
          </>
        )}

        {/* SIGNATURE */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Pour l&apos;entreprise</Text>
            <Text style={styles.signatureSubtext}>Signature et cachet</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Bon pour accord</Text>
            <Text style={styles.signatureSubtext}>
              Devis reçu avant l&apos;exécution des travaux.{"\n"}Date et signature du client :
            </Text>
          </View>
        </View>

        {/* PIED DE PAGE */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{entreprise.nomEntreprise || "BTP Pro"}</Text>
          {entreprise.siret && <Text style={styles.footerText}>SIRET : {entreprise.siret}</Text>}
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
