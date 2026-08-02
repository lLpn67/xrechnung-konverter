import { describe, expect, it } from "vitest";
import { validateInvoice } from "@/lib/xrechnung/validate";
import { generateUblXml } from "@/lib/xrechnung/generateUbl";
import type { InvoiceData } from "@/lib/xrechnung/types";

const seller = {
  name: "Mustermann Handwerk GmbH",
  street: "Musterstraße 1",
  postcode: "12345",
  city: "Musterstadt",
  countryCode: "DE",
  vatId: "DE123456789",
  email: "rechnung@mustermann-handwerk.de",
  phone: "+49 911 1234567",
  electronicAddress: "rechnung@mustermann-handwerk.de",
  electronicAddressScheme: "EM",
};

const buyer = {
  name: "Beispiel AG",
  street: "Beispielweg 2",
  postcode: "54321",
  city: "Beispielhausen",
  countryCode: "DE",
  vatId: "DE987654321",
  electronicAddress: "einkauf@beispiel-ag.de",
  electronicAddressScheme: "EM",
};

function requiredTags(xml: string): void {
  // BT-1 Rechnungsnummer
  expect(xml).toMatch(/<cbc:ID>.+<\/cbc:ID>/);
  // BT-2 Rechnungsdatum
  expect(xml).toContain("<cbc:IssueDate>");
  // BT-9 Fälligkeitsdatum
  expect(xml).toContain("<cbc:DueDate>");
  // BT-5 Währung
  expect(xml).toContain("<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>");
  // BT-31 USt-IdNr. Verkäufer + BT-48 USt-IdNr. Käufer
  expect(xml).toContain("<cac:AccountingSupplierParty>");
  expect(xml).toContain("<cac:AccountingCustomerParty>");
  // BT-34/BT-49 Elektronische Adresse (Peppol EndpointID) für beide Parteien
  expect((xml.match(/<cbc:EndpointID /g) ?? []).length).toBe(2);
  // BT-42 Telefonnummer Verkäufer
  expect(xml).toContain("<cbc:Telephone>");
  // BG-25 Rechnungspositionen
  expect(xml).toContain("<cac:InvoiceLine>");
  // BT-84 IBAN
  expect(xml).toContain("<cac:PayeeFinancialAccount>");
  // Summen
  expect(xml).toContain("<cac:LegalMonetaryTotal>");
  expect(xml).toContain("<cac:TaxTotal>");
}

describe("XRechnung UBL-Generierung", () => {
  it("Beispiel 1: einfache Rechnung mit einer Position, 19% USt", () => {
    const invoice: InvoiceData = {
      invoiceNumber: "RE-2026-001",
      issueDate: "2026-08-02",
      dueDate: "2026-08-16",
      currency: "EUR",
      typeCode: "380",
      seller,
      buyer,
      lines: [
        {
          description: "Installation Heizungsanlage",
          quantity: 1,
          unitCode: "H87",
          unitPrice: 1500,
          vatRate: 19,
        },
      ],
      iban: "DE89370400440532013000",
      accountHolder: "Mustermann Handwerk GmbH",
    };

    const validation = validateInvoice(invoice);
    expect(validation.valid).toBe(true);
    expect(validation.issues).toHaveLength(0);

    const xml = generateUblXml(invoice);
    requiredTags(xml);
    expect(xml).toContain("<cbc:ID>RE-2026-001</cbc:ID>");
    expect(xml).toContain("<cbc:LineExtensionAmount currencyID=\"EUR\">1500.00</cbc:LineExtensionAmount>");
    expect(xml).toContain("<cbc:TaxAmount currencyID=\"EUR\">285.00</cbc:TaxAmount>");
    expect(xml).toContain("<cbc:PayableAmount currencyID=\"EUR\">1785.00</cbc:PayableAmount>");
  });

  it("Beispiel 2: mehrere Positionen mit gemischten USt-Sätzen (19% und 7%)", () => {
    const invoice: InvoiceData = {
      invoiceNumber: "2026-0042",
      issueDate: "2026-03-01",
      dueDate: "2026-03-15",
      currency: "EUR",
      typeCode: "380",
      seller,
      buyer,
      lines: [
        { description: "Beratungsleistung", quantity: 4, unitCode: "HUR", unitPrice: 100, vatRate: 19 },
        { description: "Fachbuch", quantity: 2, unitCode: "H87", unitPrice: 25, vatRate: 7 },
      ],
      iban: "DE02120300000000202051",
    };

    const validation = validateInvoice(invoice);
    expect(validation.valid).toBe(true);

    const xml = generateUblXml(invoice);
    requiredTags(xml);
    // Netto: 4*100 + 2*25 = 450, USt: 400*0.19 + 50*0.07 = 76 + 3.50 = 79.50, Brutto: 529.50
    expect(xml).toContain("<cbc:LineExtensionAmount currencyID=\"EUR\">450.00</cbc:LineExtensionAmount>");
    expect(xml).toContain("<cbc:TaxAmount currencyID=\"EUR\">79.50</cbc:TaxAmount>");
    expect(xml).toContain("<cbc:PayableAmount currencyID=\"EUR\">529.50</cbc:PayableAmount>");
    // Zwei getrennte TaxSubtotal-Blöcke für die zwei Steuersätze
    expect((xml.match(/<cac:TaxSubtotal>/g) ?? []).length).toBe(2);
  });

  it("Beispiel 3: unvollständige Rechnung wird mit verständlichen deutschen Fehlermeldungen abgelehnt", () => {
    const invoice = {
      invoiceNumber: "",
      issueDate: "2026-08-02",
      dueDate: "2026-07-01", // liegt vor dem Rechnungsdatum
      currency: "EUR",
      typeCode: "380",
      seller: { ...seller, vatId: "" },
      buyer,
      lines: [],
      iban: "keine-iban",
    } as unknown as InvoiceData;

    const validation = validateInvoice(invoice);
    expect(validation.valid).toBe(false);

    const messages = validation.issues.map((issue) => issue.message);
    expect(messages.some((m) => m.includes("Rechnungsnummer"))).toBe(true);
    expect(messages.some((m) => m.includes("Umsatzsteuer-Identifikationsnummer"))).toBe(true);
    expect(messages.some((m) => m.includes("Rechnungsposition"))).toBe(true);
    expect(messages.some((m) => m.includes("IBAN"))).toBe(true);
    expect(messages.some((m) => m.includes("Fälligkeitsdatum"))).toBe(true);

    // Keine Schema-Fehlercodes, sondern lesbare deutsche Sätze
    for (const message of messages) {
      expect(message).not.toMatch(/^BR-|XSD|schema/i);
    }
  });

  it("erkennt eine IBAN mit falscher Prüfziffer trotz korrektem Format", () => {
    const invoice: InvoiceData = {
      invoiceNumber: "RE-2026-002",
      issueDate: "2026-08-02",
      dueDate: "2026-08-16",
      currency: "EUR",
      typeCode: "380",
      seller,
      buyer,
      lines: [
        { description: "Testposition", quantity: 1, unitCode: "H87", unitPrice: 10, vatRate: 19 },
      ],
      // Gleiche Zeichenlänge/Format wie eine echte IBAN, aber falsche Prüfziffer.
      iban: "DE123456789324",
    };

    const validation = validateInvoice(invoice);
    expect(validation.valid).toBe(false);
    expect(validation.issues.some((issue) => issue.message.includes("Prüfziffer"))).toBe(true);
  });

  it("verlangt beim Verkäufer Telefonnummer und E-Mail, beim Käufer nicht", () => {
    const invoice: InvoiceData = {
      invoiceNumber: "RE-2026-003",
      issueDate: "2026-08-02",
      dueDate: "2026-08-16",
      currency: "EUR",
      typeCode: "380",
      seller: { ...seller, phone: undefined, email: undefined },
      buyer,
      lines: [
        { description: "Testposition", quantity: 1, unitCode: "H87", unitPrice: 10, vatRate: 19 },
      ],
      iban: "DE89370400440532013000",
    };

    const validation = validateInvoice(invoice);
    expect(validation.valid).toBe(false);
    const messages = validation.issues.map((issue) => issue.message);
    expect(messages.some((m) => m.includes("Verkäufer") && m.includes("Telefonnummer"))).toBe(true);
    expect(messages.some((m) => m.includes("Verkäufer") && m.includes("E-Mail"))).toBe(true);
  });
});
