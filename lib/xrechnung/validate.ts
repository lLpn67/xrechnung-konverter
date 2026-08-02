import type { InvoiceData, Party, ValidationIssue, ValidationResult } from "./types";

const VAT_ID_PATTERN = /^[A-Z]{2}[A-Z0-9]{2,12}$/;
const IBAN_FORMAT_PATTERN = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}

/**
 * IBAN-Prüfziffernkontrolle nach ISO 7064 (Modulo 97-10), wie von BR-DE-19
 * für SEPA-Zahlungen (PaymentMeansCode 58) gefordert. Eine formal korrekt
 * aussehende IBAN mit falscher Prüfziffer (z. B. vertippt) wird damit erkannt.
 */
function isValidIbanChecksum(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    remainder = Number(`${remainder}${numeric.slice(i, i + 7)}`) % 97;
  }
  return remainder === 1;
}

function validateParty(
  party: Party | undefined,
  label: string,
  options: { requireContact: boolean },
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!party) {
    issues.push({ field: label, message: `${label}: Angaben fehlen vollständig.` });
    return issues;
  }
  if (isBlank(party.name)) {
    issues.push({ field: `${label}.name`, message: `${label}: Name fehlt.` });
  }
  if (isBlank(party.street)) {
    issues.push({ field: `${label}.street`, message: `${label}: Straße und Hausnummer fehlen.` });
  }
  if (isBlank(party.postcode)) {
    issues.push({ field: `${label}.postcode`, message: `${label}: Postleitzahl fehlt.` });
  }
  if (isBlank(party.city)) {
    issues.push({ field: `${label}.city`, message: `${label}: Ort fehlt.` });
  }
  if (isBlank(party.countryCode) || party.countryCode.length !== 2) {
    issues.push({
      field: `${label}.countryCode`,
      message: `${label}: Ländercode fehlt oder ist ungültig (zweistellig, z. B. "DE").`,
    });
  }
  if (isBlank(party.vatId)) {
    issues.push({
      field: `${label}.vatId`,
      message: `${label}: Umsatzsteuer-Identifikationsnummer fehlt.`,
    });
  } else if (!VAT_ID_PATTERN.test(party.vatId.toUpperCase())) {
    issues.push({
      field: `${label}.vatId`,
      message: `${label}: Umsatzsteuer-Identifikationsnummer hat ein ungültiges Format (z. B. "DE123456789").`,
    });
  }

  if (isBlank(party.electronicAddress)) {
    issues.push({
      field: `${label}.electronicAddress`,
      message: `${label}: Elektronische Adresse für den E-Rechnungs-Empfang fehlt (z. B. die E-Mail-Adresse).`,
    });
  } else if (
    (party.electronicAddressScheme ?? "EM") === "EM" &&
    !EMAIL_PATTERN.test(party.electronicAddress.trim())
  ) {
    issues.push({
      field: `${label}.electronicAddress`,
      message: `${label}: Elektronische Adresse ist bei Schema "E-Mail" keine gültige E-Mail-Adresse.`,
    });
  }

  // BT-42/BT-43 (Verkäufer) bzw. BT-56/BT-57 (Käufer): Telefon und E-Mail
  // sind laut XRechnung-CIUS nur beim Verkäufer verpflichtend.
  if (options.requireContact) {
    if (isBlank(party.phone)) {
      issues.push({ field: `${label}.phone`, message: `${label}: Telefonnummer fehlt.` });
    } else if (party.phone!.replace(/\D/g, "").length < 3) {
      issues.push({
        field: `${label}.phone`,
        message: `${label}: Telefonnummer muss mindestens 3 Ziffern enthalten.`,
      });
    }
    if (isBlank(party.email)) {
      issues.push({ field: `${label}.email`, message: `${label}: E-Mail-Adresse fehlt.` });
    } else if (!EMAIL_PATTERN.test(party.email!.trim())) {
      issues.push({
        field: `${label}.email`,
        message: `${label}: E-Mail-Adresse hat ein ungültiges Format.`,
      });
    }
  } else if (!isBlank(party.email) && !EMAIL_PATTERN.test(party.email!.trim())) {
    issues.push({
      field: `${label}.email`,
      message: `${label}: E-Mail-Adresse hat ein ungültiges Format.`,
    });
  }

  return issues;
}

/**
 * Prüft die Pflichtfelder gemäß EN 16931 / XRechnung-Basisprofil, bevor
 * überhaupt versucht wird, XML zu erzeugen. Fehlermeldungen sind bewusst
 * auf Deutsch und ohne Schema-/XSD-Jargon formuliert.
 */
export function validateInvoice(data: InvoiceData): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (isBlank(data.invoiceNumber)) {
    issues.push({ field: "invoiceNumber", message: "Rechnungsnummer fehlt (BT-1)." });
  }
  if (isBlank(data.issueDate) || !DATE_PATTERN.test(data.issueDate)) {
    issues.push({
      field: "issueDate",
      message: "Rechnungsdatum fehlt oder hat ein ungültiges Format (BT-2, erwartet JJJJ-MM-TT).",
    });
  }
  if (isBlank(data.dueDate) || !DATE_PATTERN.test(data.dueDate)) {
    issues.push({
      field: "dueDate",
      message: "Fälligkeitsdatum fehlt oder hat ein ungültiges Format (BT-9, erwartet JJJJ-MM-TT).",
    });
  }
  if (
    !isBlank(data.issueDate) &&
    !isBlank(data.dueDate) &&
    DATE_PATTERN.test(data.issueDate) &&
    DATE_PATTERN.test(data.dueDate) &&
    data.dueDate < data.issueDate
  ) {
    issues.push({
      field: "dueDate",
      message: "Das Fälligkeitsdatum liegt vor dem Rechnungsdatum. Bitte prüfen.",
    });
  }
  if (isBlank(data.currency)) {
    issues.push({ field: "currency", message: "Währung fehlt (BT-5, z. B. \"EUR\")." });
  } else if (data.currency.length !== 3) {
    issues.push({
      field: "currency",
      message: "Währung muss ein dreistelliger ISO-4217-Code sein (z. B. \"EUR\").",
    });
  }

  issues.push(...validateParty(data.seller, "Verkäufer", { requireContact: true }));
  issues.push(...validateParty(data.buyer, "Käufer", { requireContact: false }));

  if (!data.lines || data.lines.length === 0) {
    issues.push({
      field: "lines",
      message: "Mindestens eine Rechnungsposition ist erforderlich (BG-25).",
    });
  } else {
    data.lines.forEach((line, index) => {
      const pos = index + 1;
      if (isBlank(line.description)) {
        issues.push({
          field: `lines[${index}].description`,
          message: `Position ${pos}: Leistungsbeschreibung fehlt (BT-127).`,
        });
      }
      if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
        issues.push({
          field: `lines[${index}].quantity`,
          message: `Position ${pos}: Menge muss größer als 0 sein (BT-129).`,
        });
      }
      if (isBlank(line.unitCode)) {
        issues.push({
          field: `lines[${index}].unitCode`,
          message: `Position ${pos}: Mengeneinheit fehlt (BT-130, z. B. "H87" für Stück).`,
        });
      }
      if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) {
        issues.push({
          field: `lines[${index}].unitPrice`,
          message: `Position ${pos}: Einzelpreis fehlt oder ist negativ (BT-146).`,
        });
      }
      if (!Number.isFinite(line.vatRate) || line.vatRate < 0 || line.vatRate > 100) {
        issues.push({
          field: `lines[${index}].vatRate`,
          message: `Position ${pos}: USt-Satz fehlt oder ist ungültig (BT-152, 0-100).`,
        });
      }
    });
  }

  if (isBlank(data.iban)) {
    issues.push({ field: "iban", message: "IBAN für die Zahlung fehlt (BT-84)." });
  } else {
    const iban = data.iban.replace(/\s/g, "").toUpperCase();
    if (!IBAN_FORMAT_PATTERN.test(iban)) {
      issues.push({ field: "iban", message: "IBAN hat ein ungültiges Format. Bitte prüfen." });
    } else if (!isValidIbanChecksum(iban)) {
      issues.push({
        field: "iban",
        message: "IBAN-Prüfziffer ist ungültig. Bitte die IBAN noch einmal kontrollieren.",
      });
    }
  }

  return { valid: issues.length === 0, issues };
}
