// Datenmodell für eine XRechnung (Basisprofil, UBL Invoice-2).
// Feldbezeichner (BT-.../BG-...) referenzieren die Business Terms aus EN 16931.

export interface Party {
  /** BT-27 / BT-44: Vollständiger Name */
  name: string;
  /** BT-35/BT-50: Straße + Hausnummer */
  street: string;
  /** BT-38/BT-53: Postleitzahl */
  postcode: string;
  /** BT-37/BT-52: Ort */
  city: string;
  /** BT-40/BT-55: ISO-3166-1-Ländercode, z. B. "DE" */
  countryCode: string;
  /** BT-31/BT-48: Umsatzsteuer-Identifikationsnummer */
  vatId: string;
  /**
   * BT-34/BT-49: Elektronische Adresse (Peppol-EndpointID), z. B. die
   * E-Mail-Adresse bei Schema "EM" oder eine Peppol-Teilnehmerkennung.
   * Pflichtfeld für Peppol-Zustellbarkeit.
   */
  electronicAddress: string;
  /** BT-34-1/BT-49-1: Schema der elektronischen Adresse, z. B. "EM" (E-Mail) */
  electronicAddressScheme: string;
  /** BT-43/BT-57 (beim Verkäufer Pflicht): Kontakt-E-Mail */
  email?: string;
  /** BT-42/BT-56 (beim Verkäufer Pflicht): Kontakt-Telefonnummer */
  phone?: string;
  /** BT-10 (Verkäufer) / Leitweg-ID (Käufer, BT-10 beim Empfänger) */
  reference?: string;
}

export interface InvoiceLine {
  /** BT-127: Freitext-Positionsbezeichnung */
  description: string;
  /** BT-129: Menge */
  quantity: number;
  /** BT-130: Mengeneinheit (UN/ECE Rec 20 Code), z. B. "H87" (Stück), "HUR" (Stunde) */
  unitCode: string;
  /** BT-146: Einzelpreis (netto) */
  unitPrice: number;
  /** BT-152: Umsatzsteuersatz in Prozent */
  vatRate: number;
}

export interface InvoiceData {
  /** BT-1: Rechnungsnummer */
  invoiceNumber: string;
  /** BT-2: Rechnungsdatum (YYYY-MM-DD) */
  issueDate: string;
  /** BT-9: Fälligkeitsdatum (YYYY-MM-DD) */
  dueDate: string;
  /** BT-5: Rechnungswährung, z. B. "EUR" */
  currency: string;
  /** BT-3: Rechnungstyp-Code, Standard 380 = Handelsrechnung */
  typeCode: string;
  seller: Party;
  buyer: Party;
  /** BG-25: Rechnungspositionen */
  lines: InvoiceLine[];
  /** BT-84: IBAN für die Überweisung */
  iban: string;
  /** BT-85 (optional): Kontoinhaber */
  accountHolder?: string;
  /** BT-86 (optional): BIC */
  bic?: string;
  /** BT-22 (optional): Freitext-Notiz auf der Rechnung */
  note?: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
