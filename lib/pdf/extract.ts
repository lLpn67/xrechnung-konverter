// Best-effort-Extraktion von Standardfeldern aus dem Text einer hochgeladenen
// PDF-Rechnung. Dient NUR dazu, das Formular vorauszufüllen – niemals als
// alleinige Quelle. Die Ergebnisse müssen vom Nutzer geprüft werden.
// Kein OCR/ML: rein regelbasierte Heuristik auf extrahiertem PDF-Text.

export interface ExtractedParty {
  name?: string;
  street?: string;
  postcode?: string;
  city?: string;
}

export interface ExtractedLine {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ExtractedFields {
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  iban?: string;
  bic?: string;
  totalAmount?: string;
  vatRate?: number;
  seller?: ExtractedParty;
  buyer?: ExtractedParty;
  lines?: ExtractedLine[];
}

function toIsoDate(day: string, month: string, year: string): string {
  const y = year.length === 2 ? `20${year}` : year;
  return `${y}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function toLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Wandelt eine deutsche Zahl ("1.234,56" oder "25,00") in eine JS-Zahl um. */
function parseGermanNumber(raw: string): number {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized);
}

/**
 * Erkennt bis zu zwei Adressblöcke (Name + Straße + PLZ/Ort) vor dem
 * Rechnungskopf und nimmt an: der erste Block ist der Verkäufer, der zweite
 * der Käufer. Das ist eine reine Lageheuristik und kann bei untypischen
 * Layouts falsch liegen – daher immer nur als Vorschlag behandeln.
 */
function extractParties(lines: string[]): { seller?: ExtractedParty; buyer?: ExtractedParty } {
  const plzCityPattern = /^(\d{5})\s+(.+)$/;
  const stopPattern = /rechnungsdatum|rechnungsnummer|kundennummer|^rechnung$/i;
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (stopPattern.test(line)) break;
    current.push(line);
    if (plzCityPattern.test(line)) {
      blocks.push(current);
      current = [];
      if (blocks.length >= 2) break;
    }
  }

  if (blocks.length < 2) return {};

  const toParty = (block: string[]): ExtractedParty | undefined => {
    const last = block[block.length - 1];
    const match = last.match(plzCityPattern);
    if (!match || block.length < 2) return undefined;
    const [, postcode, city] = match;
    return {
      name: block[0],
      street: block.slice(1, -1).join(", ") || undefined,
      postcode,
      city,
    };
  };

  return { seller: toParty(blocks[0]), buyer: toParty(blocks[1]) };
}

/**
 * Erkennt Rechnungspositionen aus tabellenartigen Zeilen der Form
 * "Beschreibung  Menge  Einzelpreis €  Gesamt €". Der USt-Satz steht meist
 * separat (z. B. "MwSt. (19%)") und wird an anderer Stelle ermittelt.
 */
function extractLines(lines: string[]): ExtractedLine[] {
  const linePattern = /^(.+)\s+(\d+(?:[.,]\d+)?)\s+([\d.,]+)\s*(?:€|EUR)\s+([\d.,]+)\s*(?:€|EUR)\s*$/i;
  const result: ExtractedLine[] = [];

  for (const line of lines) {
    const match = line.match(linePattern);
    if (!match) continue;
    const [, descriptionRaw, quantityRaw, unitPriceRaw] = match;
    const quantity = parseGermanNumber(quantityRaw);
    const unitPrice = parseGermanNumber(unitPriceRaw);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice)) continue;
    result.push({ description: descriptionRaw.trim(), quantity, unitPrice });
  }

  return result;
}

export function extractFieldsFromText(text: string): ExtractedFields {
  const result: ExtractedFields = {};
  const lines = toLines(text);

  const invoiceNumberMatch = text.match(
    /rechnung(?:s)?(?:-|\s)?(?:nr\.?|nummer)\s*[:#]?\s*([A-Za-z0-9\-\/]{3,30})/i,
  );
  if (invoiceNumberMatch) {
    result.invoiceNumber = invoiceNumberMatch[1].trim();
  }

  const dateMatches = Array.from(
    text.matchAll(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/g),
  );
  const issueDateLabelMatch = text.match(
    /(?:rechnungsdatum|datum)\s*[:#]?\s*(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/i,
  );
  if (issueDateLabelMatch) {
    const [, d, m, y] = issueDateLabelMatch;
    result.issueDate = toIsoDate(d, m, y);
  } else if (dateMatches.length > 0) {
    const [, d, m, y] = dateMatches[0];
    result.issueDate = toIsoDate(d, m, y);
  }

  const dueDateLabelMatch = text.match(
    /(?:fällig(?:keitsdatum)?|zahlbar bis)\s*[:#]?\s*(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/i,
  );
  if (dueDateLabelMatch) {
    const [, d, m, y] = dueDateLabelMatch;
    result.dueDate = toIsoDate(d, m, y);
  } else {
    // Kein explizites Fälligkeitsdatum gefunden – aus "Zahlungsziel: N Tage"
    // relativ zum Rechnungsdatum berechnen, falls beides vorhanden ist.
    const paymentTermMatch = text.match(/zahlungsziel\s*[:#]?\s*(\d{1,3})\s*tage/i);
    if (paymentTermMatch && result.issueDate) {
      const [y, m, d] = result.issueDate.split("-").map(Number);
      // Date.UTC statt lokaler Zeitzone verwenden, damit toISOString() nicht
      // je nach Serverzeitzone auf den Vor- oder Folgetag verschiebt.
      const issue = new Date(Date.UTC(y, m - 1, d));
      if (!Number.isNaN(issue.getTime())) {
        issue.setUTCDate(issue.getUTCDate() + parseInt(paymentTermMatch[1], 10));
        result.dueDate = issue.toISOString().slice(0, 10);
      }
    }
  }

  const ibanMatch = text.match(/\bDE\d{2}(?:\s?\d{4}){4}\s?\d{2}\b/);
  if (ibanMatch) {
    result.iban = ibanMatch[0].replace(/\s/g, "");
  }

  const bicMatch = text.match(/\bBIC\s*[:#]?\s*([A-Z0-9]{8}(?:[A-Z0-9]{3})?)\b/i);
  if (bicMatch) {
    result.bic = bicMatch[1].toUpperCase();
  }

  const totalMatch = text.match(
    /(?:gesamtbetrag|gesamtsumme|rechnungsbetrag|summe brutto|zu zahlen)\s*[:#]?\s*([\d.,]+)\s*(?:€|eur)?/i,
  );
  if (totalMatch) {
    result.totalAmount = totalMatch[1].trim();
  }

  const vatRateMatch = text.match(/(?:mwst|ust)\.?\s*\(?\s*(\d{1,2}(?:[.,]\d+)?)\s*%\)?/i);
  if (vatRateMatch) {
    result.vatRate = parseGermanNumber(vatRateMatch[1]);
  }

  const { seller, buyer } = extractParties(lines);
  if (seller) result.seller = seller;
  if (buyer) result.buyer = buyer;

  const extractedLines = extractLines(lines);
  if (extractedLines.length > 0) {
    result.lines = extractedLines;
  }

  return result;
}
