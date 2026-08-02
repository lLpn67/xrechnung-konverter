// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Bitte eine gültige E-Mail-Adresse angeben." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Kein Key gesetzt (z. B. lokal ohne .env) -> nicht hart crashen
      console.warn("RESEND_API_KEY fehlt, Warteliste wird nicht gespeichert.");
      return NextResponse.json(
        { error: "Warteliste ist aktuell nicht konfiguriert." },
        { status: 503 }
      );
    }

    const resend = new Resend(apiKey);

    // Neues, globales Contacts-Modell -> keine audience_id mehr nötig
    const { data, error } = await resend.contacts.create({
      email,
      unsubscribed: false,
    });

    if (error) {
      // Resend gibt z. B. einen Fehler zurück, wenn der Kontakt schon existiert
      const alreadyExists = error.message?.toLowerCase().includes("already exists");
      if (alreadyExists) {
        return NextResponse.json({ success: true, alreadyRegistered: true });
      }
      console.error("Resend contacts.create error:", error);
      return NextResponse.json(
        { error: "Eintragung fehlgeschlagen. Bitte später erneut versuchen." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, contactId: data?.id });
  } catch (err) {
    console.error("Unerwarteter Fehler bei /api/subscribe:", err);
    return NextResponse.json(
      { error: "Interner Fehler." },
      { status: 500 }
    );
  }
}
