import type { InvoiceData, InvoiceLine } from "./types";

// Erzeugt eine XRechnung im UBL-Format (Invoice-2), EN 16931 / XRechnung 3.x
// Basisprofil. Die Struktur folgt der offiziellen XRechnung-Syntaxbindung für
// UBL (nicht CII). Für eine verbindliche Konformitätsprüfung vor dem
// produktiven Versand empfiehlt sich zusätzlich der offizielle KoSIT-
// Validator (nicht Teil dieses MVP, siehe README).
//
// Ausbaustufe (nicht im MVP): ZUGFeRD-Hybrid, d. h. dieses XML eingebettet
// in ein PDF/A-3-Dokument (Facture-X/ZUGFeRD 2.x Struktur).

const CUSTOMIZATION_ID =
  "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0";
const PROFILE_ID = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";
const UNIT_CODE_DEFAULT = "C62"; // UN/ECE Rec 20: "Stück/Einheit" allgemein
const PAYMENT_MEANS_CODE = "58"; // SEPA-Überweisung

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function fmt(value: number): string {
  return round2(value).toFixed(2);
}

function lineNetAmount(line: InvoiceLine): number {
  return round2(line.quantity * line.unitPrice);
}

function taxCategoryId(vatRate: number): string {
  // "Z" = steuerfrei (0 %), "S" = Regel-/ermäßigter Steuersatz.
  return vatRate === 0 ? "Z" : "S";
}

function groupByVatRate(lines: InvoiceLine[]): Map<number, InvoiceLine[]> {
  const groups = new Map<number, InvoiceLine[]>();
  for (const line of lines) {
    const existing = groups.get(line.vatRate) ?? [];
    existing.push(line);
    groups.set(line.vatRate, existing);
  }
  return groups;
}

function renderParty(
  tag: "cac:AccountingSupplierParty" | "cac:AccountingCustomerParty",
  party: InvoiceData["seller"] | InvoiceData["buyer"],
  currency: string,
): string {
  const scheme = party.electronicAddressScheme?.trim() || "EM";
  return `  <${tag}>
    <cac:Party>
      <cbc:EndpointID schemeID="${escapeXml(scheme)}">${escapeXml(party.electronicAddress)}</cbc:EndpointID>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(party.street)}</cbc:StreetName>
        <cbc:CityName>${escapeXml(party.city)}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(party.postcode)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${escapeXml(party.countryCode)}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(party.vatId)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(party.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
      <cac:Contact>
        <cbc:Name>${escapeXml(party.name)}</cbc:Name>
        ${party.phone ? `<cbc:Telephone>${escapeXml(party.phone)}</cbc:Telephone>` : ""}
        ${party.email ? `<cbc:ElectronicMail>${escapeXml(party.email)}</cbc:ElectronicMail>` : ""}
      </cac:Contact>
    </cac:Party>
  </${tag}>`;
}

/**
 * Wandelt validierte Rechnungsdaten in eine UBL-XRechnung (XML-String) um.
 * Ruft KEINE Validierung auf – der Aufrufer muss vorher validateInvoice()
 * erfolgreich durchlaufen haben.
 */
export function generateUblXml(data: InvoiceData): string {
  const currency = data.currency.toUpperCase();
  const lineExtensionTotal = round2(
    data.lines.reduce((sum, line) => sum + lineNetAmount(line), 0),
  );
  const vatGroups = groupByVatRate(data.lines);
  const taxSubtotals = Array.from(vatGroups.entries()).map(([vatRate, lines]) => {
    const taxable = round2(lines.reduce((sum, line) => sum + lineNetAmount(line), 0));
    const taxAmount = round2((taxable * vatRate) / 100);
    return { vatRate, taxable, taxAmount };
  });
  const totalTaxAmount = round2(taxSubtotals.reduce((sum, group) => sum + group.taxAmount, 0));
  const taxInclusiveAmount = round2(lineExtensionTotal + totalTaxAmount);

  const buyerReference = data.buyer.reference?.trim() || data.invoiceNumber;

  const invoiceLinesXml = data.lines
    .map((line, index) => {
      const net = lineNetAmount(line);
      const unitCode = line.unitCode || UNIT_CODE_DEFAULT;
      return `  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${escapeXml(unitCode)}">${line.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${fmt(net)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${escapeXml(line.description)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${taxCategoryId(line.vatRate)}</cbc:ID>
        <cbc:Percent>${fmt(line.vatRate)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currency}">${fmt(line.unitPrice)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
    })
    .join("\n");

  const taxSubtotalsXml = taxSubtotals
    .map(
      (group) => `    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${fmt(group.taxable)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${fmt(group.taxAmount)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${taxCategoryId(group.vatRate)}</cbc:ID>
        <cbc:Percent>${fmt(group.vatRate)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>${CUSTOMIZATION_ID}</cbc:CustomizationID>
  <cbc:ProfileID>${PROFILE_ID}</cbc:ProfileID>
  <cbc:ID>${escapeXml(data.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
  <cbc:DueDate>${data.dueDate}</cbc:DueDate>
  <cbc:InvoiceTypeCode>${data.typeCode || "380"}</cbc:InvoiceTypeCode>
  ${data.note ? `<cbc:Note>${escapeXml(data.note)}</cbc:Note>` : ""}
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  <cbc:BuyerReference>${escapeXml(buyerReference)}</cbc:BuyerReference>
${renderParty("cac:AccountingSupplierParty", data.seller, currency)}
${renderParty("cac:AccountingCustomerParty", data.buyer, currency)}
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>${PAYMENT_MEANS_CODE}</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${escapeXml(data.iban.replace(/\s/g, ""))}</cbc:ID>
      ${data.accountHolder ? `<cbc:Name>${escapeXml(data.accountHolder)}</cbc:Name>` : ""}
      ${
        data.bic
          ? `<cac:FinancialInstitutionBranch><cbc:ID>${escapeXml(data.bic)}</cbc:ID></cac:FinancialInstitutionBranch>`
          : ""
      }
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${fmt(totalTaxAmount)}</cbc:TaxAmount>
${taxSubtotalsXml}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${fmt(lineExtensionTotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${fmt(lineExtensionTotal)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${fmt(taxInclusiveAmount)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${fmt(taxInclusiveAmount)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${invoiceLinesXml}
</Invoice>
`;

  // Leerzeilen durch optionale Felder (z. B. fehlende Note) entfernen, damit
  // das XML sauber bleibt.
  return xml
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .join("\n");
}
