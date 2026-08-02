// Wandelt eine hochgeladene Datei (PDF, DOCX oder TXT) in reinen Text um,
// der anschließend an extractFieldsFromText() weitergereicht wird.

export type SupportedDocumentType = "pdf" | "docx" | "txt";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export class UnsupportedDocumentError extends Error {}

export function detectDocumentType(filename: string, mimeType: string): SupportedDocumentType {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (mimeType === "application/pdf" || ext === "pdf") return "pdf";
  if (mimeType === DOCX_MIME || ext === "docx") return "docx";
  if (mimeType === "text/plain" || ext === "txt") return "txt";
  throw new UnsupportedDocumentError(
    "Dieses Dateiformat wird nicht unterstützt. Bitte lade eine PDF-, DOCX- oder TXT-Datei hoch.",
  );
}

export async function extractTextFromDocument(
  buffer: Buffer,
  type: SupportedDocumentType,
): Promise<string> {
  switch (type) {
    case "pdf": {
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      return parsed.text;
    }
    case "docx": {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case "txt":
      return buffer.toString("utf-8");
  }
}
