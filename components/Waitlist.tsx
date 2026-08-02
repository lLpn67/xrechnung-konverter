"use client";

import { FormEvent, useState } from "react";

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Eintragung fehlgeschlagen. Bitte versuche es später erneut.");
        return;
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Eintragung fehlgeschlagen. Bitte versuche es später erneut.");
    }
  }

  return (
    <section className="bg-ink py-16 text-white">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Bald: laufender Rechnungsversand &amp; -empfang per Peppol
        </h2>
        <p className="mt-3 text-white/70">
          Ab 9&nbsp;€/Monat automatisieren wir E-Rechnungen dauerhaft für dich –
          inklusive Empfang, Versand über Peppol und GoBD-konformer Archivierung.
          Trag dich ein, um zu den ersten Nutzern zu gehören.
        </p>
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="waitlist-email" className="sr-only">
            E-Mail-Adresse
          </label>
          <input
            id="waitlist-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="deine@email.de"
            className="w-full rounded-md border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="shrink-0 rounded-md bg-accent px-6 py-3 font-medium text-white transition hover:bg-accent-light disabled:opacity-60"
          >
            {status === "loading" ? "Wird gesendet…" : "Auf die Warteliste"}
          </button>
        </form>
        {status === "success" && (
          <p className="mt-3 text-sm text-accent-light">Danke! Wir melden uns, sobald es losgeht.</p>
        )}
        {status === "error" && <p className="mt-3 text-sm text-red-300">{message}</p>}
      </div>
    </section>
  );
}
