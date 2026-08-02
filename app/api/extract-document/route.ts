import { NextRequest, NextResponse } from "next/server";
import { extractFieldsFromText } from "@/lib/document/extractFields";
import {
  detectDocumentType,
  extractTextFromDocument,
  UnsupportedDocumentError,
} from "@/lib/document/parseDocument";

// Komfortfunktion: Der Dateiinhalt wird nur für die Dauer dieser Anfrage im
// Speicher verarbeitet, nirgends abgelegt. Das Ergebnis dient ausschließlich
// zum Vorausfüllen des Formulars ("bitte prüfen"). Unterstützt PDF, DOCX (Word)
// und TXT als Quellformate.
export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Keine Datei gefunden. Bitte lade eine Rechnung als PDF, DOCX oder TXT hoch." },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Die Datei ist zu groß (maximal 10 MB)." },
      { status: 400 },
    );
  }

  let documentType;
  try {
    documentType = detectDocumentType(file.name, file.type);
  } catch (error) {
    if (error instanceof UnsupportedDocumentError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = await extractTextFromDocument(buffer, documentType);
    const fields = extractFieldsFromText(text);
    return NextResponse.json({ fields, note: "Bitte alle vorausgefüllten Felder prüfen." });
  } catch {
    return NextResponse.json(
      {
        error:
          "Der Text konnte aus dieser Datei nicht automatisch gelesen werden. Bitte fülle das Formular manuell aus.",
      },
      { status: 422 },
    );
  }
}
