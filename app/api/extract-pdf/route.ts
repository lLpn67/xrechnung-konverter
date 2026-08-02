import { NextRequest, NextResponse } from "next/server";
import { extractFieldsFromText } from "@/lib/pdf/extract";

// Komfortfunktion: Text aus der hochgeladenen PDF wird nur für die Dauer
// dieser Anfrage im Speicher verarbeitet, nirgends abgelegt. Das Ergebnis
// dient ausschließlich zum Vorausfüllen des Formulars ("bitte prüfen").
export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Keine PDF-Datei gefunden. Bitte lade eine Rechnung als PDF hoch." },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Die Datei ist zu groß (maximal 10 MB)." },
      { status: 400 },
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    const fields = extractFieldsFromText(parsed.text);
    return NextResponse.json({ fields, note: "Bitte alle vorausgefüllten Felder prüfen." });
  } catch {
    return NextResponse.json(
      {
        error:
          "Der Text konnte aus dieser PDF nicht automatisch gelesen werden. Bitte fülle das Formular manuell aus.",
      },
      { status: 422 },
    );
  }
}
