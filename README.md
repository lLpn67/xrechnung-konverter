# XRechnung-Konverter

Kostenloses Lead-Magnet-Tool: Formulardaten (oder eine hochgeladene Rechnung als
PDF, Word/DOCX oder TXT zum Vorausfüllen) werden in eine standardkonforme
**XRechnung im UBL-Format** (EN 16931 / XRechnung 3.x) umgewandelt und als
XML-Datei heruntergeladen.

## Lokales Setup

Voraussetzung: Node.js 18+.

```bash
npm install
npm run dev
```

Die App läuft dann unter `http://localhost:3000`.

## Tests

```bash
npm test
```

Die Tests in `tests/xrechnung.test.ts` erzeugen XML für drei Beispiel-Rechnungen
(einfache Rechnung, Rechnung mit gemischten USt-Sätzen, unvollständige Rechnung)
und prüfen sowohl die EN-16931-Pflichtfeldvalidierung als auch die erzeugte
XML-Struktur (Rechnungsnummer, Datum, Währung, Parteien, Positionen, Summen).

## ENV-Variablen

Siehe `.env.example`. Für die Warteliste (E-Mail-Erfassung für das kommende
Abo-Produkt) wird [Resend](https://resend.com) über das globale Contacts-API
genutzt (keine separate Audience-ID nötig):

| Variable | Beschreibung |
|---|---|
| `RESEND_API_KEY` | API-Key aus dem Resend-Dashboard (`re_...`) |

Ohne gesetzten `RESEND_API_KEY` gibt `/api/subscribe` einen 503-Fehler zurück,
statt hart abzustürzen — die restliche App (XRechnung-Erzeugung) funktioniert
davon unabhängig.

## Deploy auf Vercel

1. Repository zu GitHub pushen.
2. In Vercel „New Project“ → Repository auswählen → Next.js wird automatisch erkannt.
3. ENV-Variablen aus `.env.example` im Vercel-Projekt hinterlegen (Settings → Environment Variables).
4. Deploy auslösen.

Es wird keine Datenbank benötigt. Rechnungsdaten werden ausschließlich innerhalb
einer einzelnen Server-Anfrage verarbeitet und nirgends gespeichert.

## Architektur

- `lib/xrechnung/types.ts` — Datenmodell der Rechnung (Business Terms nach EN 16931 kommentiert).
- `lib/xrechnung/validate.ts` — Pflichtfeldprüfung mit verständlichen deutschen Fehlermeldungen.
- `lib/xrechnung/generateUbl.ts` — UBL-Invoice-2-XML-Generierung.
- `lib/document/extractFields.ts` — Heuristische Textextraktion (Regex, kein OCR/ML) zum Vorausfüllen, unabhängig vom Quellformat.
- `lib/document/parseDocument.ts` — wandelt PDF (`pdf-parse`), DOCX (`mammoth`) oder TXT in reinen Text um.
- `app/api/generate-xml` — validiert und erzeugt die XML-Datei (Server-seitig, keine Persistenz).
- `app/api/extract-document` — nimmt eine PDF-, DOCX- oder TXT-Datei entgegen, extrahiert Text und gibt Vorschlagsfelder zurück.
- `app/api/subscribe` — Waitlist-Eintragung über Resend (Contacts-API).
- `components/InvoiceTool.tsx` — Formular inkl. Datei-Upload und Download-Flow.

### Ausbaustufen (nicht Teil dieses MVP)

- **ZUGFeRD-Hybrid-PDF**: das erzeugte XML eingebettet in ein PDF/A-3-Dokument
  (Facture-X/ZUGFeRD-2.x-Struktur), sodass eine Datei sowohl maschinenlesbar
  als auch visuell darstellbar ist.
- **KoSIT-Validator-Integration**: verbindliche Schema-/Business-Rule-Validierung
  gegen den offiziellen XRechnung-Validator (Java-basiert) als zusätzlicher
  Prüfschritt vor dem Download bzw. als CI-Schritt.
- **Peppol-Versand/-Empfang und GoBD-Archivierung**: Teil des geplanten
  Abo-Produkts, nicht dieses kostenlosen Tools.
- Nutzerkonten, Mandantenverwaltung, Zahlungsintegration.

## Rechtlicher Hinweis

Dieses Tool dient der technischen Erzeugung einer XRechnung-Datei und ersetzt
**keine Steuerberatung**. Es wird keine Garantie für die vollständige Konformität
der erzeugten XML mit dem XRechnung-/EN-16931-Standard oder für die
GoBD-konforme Archivierung übernommen. Die Pflichtfeldprüfung deckt die
wichtigsten Business Terms ab, ersetzt aber keine vollständige
Schema-Validierung (z. B. durch den offiziellen KoSIT-Validator). Bitte prüfe
jede erzeugte Rechnung vor dem Versand sorgfältig und ziehe im Zweifel deine
Steuerberatung hinzu. Angaben zu gesetzlichen Fristen auf der Landingpage
(`lib/content/legal.ts`) sind ohne Gewähr und sollten vor Veröffentlichung
gegen die aktuelle Fassung der BMF-Vorgaben zu § 14 UStG geprüft werden.
