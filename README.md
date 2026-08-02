# XRechnung-Konverter

Kostenloses Lead-Magnet-Tool: Formulardaten (oder eine hochgeladene PDF-Rechnung
zum Vorausfüllen) werden in eine standardkonforme **XRechnung im UBL-Format**
(EN 16931 / XRechnung 3.x) umgewandelt und als XML-Datei heruntergeladen.

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
Abo-Produkt) einen der beiden Anbieter konfigurieren:

| Variable | Beschreibung |
|---|---|
| `EMAIL_PROVIDER` | `resend` oder `buttondown` |
| `RESEND_API_KEY` / `RESEND_AUDIENCE_ID` | bei Wahl von Resend |
| `BUTTONDOWN_API_KEY` | bei Wahl von Buttondown |

Ohne Konfiguration schreibt die App lokal in `.waitlist-local.txt` (nicht für
Produktivbetrieb geeignet, da das Dateisystem auf Vercel flüchtig ist).

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
- `lib/pdf/extract.ts` — Heuristische Textextraktion aus PDFs (Regex, kein OCR/ML) zum Vorausfüllen.
- `app/api/generate-xml` — validiert und erzeugt die XML-Datei (Server-seitig, keine Persistenz).
- `app/api/extract-pdf` — nimmt eine PDF entgegen, extrahiert Text mit `pdf-parse`, gibt Vorschlagsfelder zurück.
- `app/api/subscribe` — Waitlist-Eintragung über Resend/Buttondown.
- `components/InvoiceTool.tsx` — Formular inkl. PDF-Upload und Download-Flow.

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
