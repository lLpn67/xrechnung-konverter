import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { detectDocumentType, extractTextFromDocument } from "@/lib/document/parseDocument";
import { extractFieldsFromText } from "@/lib/document/extractFields";

async function buildMinimalDocx(paragraphs: string[]): Promise<Buffer> {
  const zip = new JSZip();
  const body = paragraphs
    .map((p) => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`)
    .join("");
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}</w:body>
</w:document>`;

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip.file("word/document.xml", documentXml);

  const content = await zip.generateAsync({ type: "nodebuffer" });
  return content;
}

describe("DOCX-Extraktion", () => {
  it("liest Text aus einer minimalen DOCX-Datei und extrahiert Felder", async () => {
    const docx = await buildMinimalDocx([
      "Rechnungsnummer: RE-2026-0007",
      "Rechnungsdatum: 15.06.2026",
      "IBAN: DE89 3704 0044 0532 0130 00",
    ]);

    const type = detectDocumentType("testrechnung.docx", "");
    expect(type).toBe("docx");

    const text = await extractTextFromDocument(docx, type);
    expect(text).toContain("RE-2026-0007");

    const fields = extractFieldsFromText(text);
    expect(fields.invoiceNumber).toBe("RE-2026-0007");
    expect(fields.issueDate).toBe("2026-06-15");
    expect(fields.iban).toBe("DE89370400440532013000");
  });

  it("liest Text aus einer TXT-Datei", async () => {
    const type = detectDocumentType("rechnung.txt", "text/plain");
    expect(type).toBe("txt");
    const text = await extractTextFromDocument(
      Buffer.from("Rechnungsnummer: TXT-001\nRechnungsdatum: 01.01.2026"),
      type,
    );
    const fields = extractFieldsFromText(text);
    expect(fields.invoiceNumber).toBe("TXT-001");
  });

  it("lehnt nicht unterstützte Formate ab", () => {
    expect(() => detectDocumentType("bild.png", "image/png")).toThrow();
  });
});
