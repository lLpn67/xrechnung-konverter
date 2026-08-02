import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Trägt eine E-Mail-Adresse in die Warteliste für das kommende Abo-Produkt
// ein. Unterstützt zwei Anbieter über ENV-Variablen (siehe README):
//   EMAIL_PROVIDER=resend      + RESEND_API_KEY + RESEND_AUDIENCE_ID
//   EMAIL_PROVIDER=buttondown  + BUTTONDOWN_API_KEY
// Ist keiner konfiguriert, wird lokal in eine Datei geschrieben (nur für die
// lokale Entwicklung geeignet – auf Vercel ist das Dateisystem flüchtig,
// dort bitte einen der beiden Anbieter konfigurieren).
export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function subscribeResend(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    throw new Error("Resend ist nicht vollständig konfiguriert (RESEND_API_KEY/RESEND_AUDIENCE_ID).");
  }
  const response = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  });
  if (!response.ok) {
    throw new Error(`Resend-API-Fehler: ${response.status}`);
  }
}

async function subscribeButtondown(email: string): Promise<void> {
  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    throw new Error("Buttondown ist nicht konfiguriert (BUTTONDOWN_API_KEY).");
  }
  const response = await fetch("https://api.buttondown.email/v1/subscribers", {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  if (!response.ok && response.status !== 409) {
    throw new Error(`Buttondown-API-Fehler: ${response.status}`);
  }
}

async function subscribeLocalFallback(email: string): Promise<void> {
  const filePath = path.join(process.cwd(), ".waitlist-local.txt");
  await fs.appendFile(filePath, `${email}\t${new Date().toISOString()}\n`, "utf-8");
}

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "Bitte gib eine gültige E-Mail-Adresse ein." },
      { status: 400 },
    );
  }

  const provider = process.env.EMAIL_PROVIDER;
  try {
    if (provider === "resend") {
      await subscribeResend(email);
    } else if (provider === "buttondown") {
      await subscribeButtondown(email);
    } else {
      await subscribeLocalFallback(email);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Waitlist-Eintragung fehlgeschlagen", error);
    return NextResponse.json(
      { error: "Eintragung fehlgeschlagen. Bitte versuche es später erneut." },
      { status: 502 },
    );
  }
}
