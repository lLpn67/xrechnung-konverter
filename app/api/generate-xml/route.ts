import { NextRequest, NextResponse } from "next/server";
import { validateInvoice } from "@/lib/xrechnung/validate";
import { generateUblXml } from "@/lib/xrechnung/generateUbl";
import type { InvoiceData } from "@/lib/xrechnung/types";

// Verarbeitet die Rechnungsdaten ausschließlich im Arbeitsspeicher dieser
// einzelnen Anfrage. Es findet keine Speicherung in einer Datenbank, Datei
// oder einem Log statt.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let data: InvoiceData;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ungültige Anfrage: Die gesendeten Daten konnten nicht gelesen werden." },
      { status: 400 },
    );
  }

  const validation = validateInvoice(data);
  if (!validation.valid) {
    return NextResponse.json({ issues: validation.issues }, { status: 422 });
  }

  const xml = generateUblXml(data);
  const filename = `xrechnung-${data.invoiceNumber.replace(/[^A-Za-z0-9\-_]/g, "_")}.xml`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
