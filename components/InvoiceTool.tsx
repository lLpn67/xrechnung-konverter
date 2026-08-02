"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";

interface PartyForm {
  name: string;
  street: string;
  postcode: string;
  city: string;
  countryCode: string;
  vatId: string;
  email: string;
  phone: string;
  electronicAddress: string;
  electronicAddressScheme: string;
}

interface LineForm {
  description: string;
  quantity: string;
  unitCode: string;
  unitPrice: string;
  vatRate: string;
}

interface FormState {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  seller: PartyForm;
  buyer: PartyForm;
  lines: LineForm[];
  iban: string;
  accountHolder: string;
  bic: string;
  note: string;
}

const EMPTY_PARTY: PartyForm = {
  name: "",
  street: "",
  postcode: "",
  city: "",
  countryCode: "DE",
  vatId: "",
  email: "",
  phone: "",
  electronicAddress: "",
  electronicAddressScheme: "EM",
};

const ELECTRONIC_ADDRESS_SCHEMES = [
  { value: "EM", label: "E-Mail-Adresse" },
  { value: "9930", label: "Peppol-ID auf Basis USt-IdNr. (DE:VAT)" },
  { value: "0204", label: "Leitweg-ID (öffentliche Auftraggeber)" },
];

const EMPTY_LINE: LineForm = {
  description: "",
  quantity: "1",
  unitCode: "H87",
  unitPrice: "",
  vatRate: "19",
};

const UNIT_OPTIONS = [
  { value: "H87", label: "Stück" },
  { value: "HUR", label: "Stunde" },
  { value: "DAY", label: "Tag" },
  { value: "LS", label: "Pauschale" },
  { value: "C62", label: "Einheit" },
];

function initialFormState(): FormState {
  return {
    invoiceNumber: "",
    issueDate: "",
    dueDate: "",
    currency: "EUR",
    seller: { ...EMPTY_PARTY },
    buyer: { ...EMPTY_PARTY },
    lines: [{ ...EMPTY_LINE }],
    iban: "",
    accountHolder: "",
    bic: "",
    note: "",
  };
}

function labelClass() {
  return "block text-sm font-medium text-ink/80";
}

function inputClass() {
  return "mt-1 w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
}

export function InvoiceTool() {
  const [form, setForm] = useState<FormState>(initialFormState());
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [pdfStatus, setPdfStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [pdfMessage, setPdfMessage] = useState<string>("");

  const totalNet = useMemo(() => {
    return form.lines.reduce((sum, line) => {
      const qty = parseFloat(line.quantity.replace(",", "."));
      const price = parseFloat(line.unitPrice.replace(",", "."));
      if (Number.isFinite(qty) && Number.isFinite(price)) {
        return sum + qty * price;
      }
      return sum;
    }, 0);
  }, [form.lines]);

  function updateParty(target: "seller" | "buyer", field: keyof PartyForm, value: string) {
    setForm((prev) => ({ ...prev, [target]: { ...prev[target], [field]: value } }));
  }

  function updateLine(index: number, field: keyof LineForm, value: string) {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    }));
  }

  function addLine() {
    setForm((prev) => ({ ...prev, lines: [...prev.lines, { ...EMPTY_LINE }] }));
  }

  function removeLine(index: number) {
    setForm((prev) => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) }));
  }

  async function handlePdfUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPdfStatus("loading");
    setPdfMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/extract-document", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) {
        setPdfStatus("error");
        setPdfMessage(data.error ?? "Datei konnte nicht gelesen werden.");
        return;
      }
      const fields = data.fields ?? {};
      setForm((prev) => ({
        ...prev,
        invoiceNumber: fields.invoiceNumber || prev.invoiceNumber,
        issueDate: fields.issueDate || prev.issueDate,
        dueDate: fields.dueDate || prev.dueDate,
        iban: fields.iban || prev.iban,
        bic: fields.bic || prev.bic,
        seller: fields.seller
          ? {
              ...prev.seller,
              name: fields.seller.name || prev.seller.name,
              street: fields.seller.street || prev.seller.street,
              postcode: fields.seller.postcode || prev.seller.postcode,
              city: fields.seller.city || prev.seller.city,
            }
          : prev.seller,
        buyer: fields.buyer
          ? {
              ...prev.buyer,
              name: fields.buyer.name || prev.buyer.name,
              street: fields.buyer.street || prev.buyer.street,
              postcode: fields.buyer.postcode || prev.buyer.postcode,
              city: fields.buyer.city || prev.buyer.city,
            }
          : prev.buyer,
        lines:
          Array.isArray(fields.lines) && fields.lines.length > 0
            ? fields.lines.map((line: { description: string; quantity: number; unitPrice: number }) => ({
                description: line.description,
                quantity: String(line.quantity).replace(".", ","),
                unitCode: "H87",
                unitPrice: String(line.unitPrice).replace(".", ","),
                vatRate:
                  fields.vatRate !== undefined
                    ? String(fields.vatRate).replace(".", ",")
                    : prev.lines[0]?.vatRate ?? "19",
              }))
            : prev.lines,
      }));
      setPdfStatus("done");
      const hints: string[] = [
        "Felder wurden nach bestem Wissen vorausgefüllt. Bitte alle Angaben sorgfältig prüfen, bevor du fortfährst.",
      ];
      if (fields.seller || fields.buyer) {
        hints.push(
          "Verkäufer/Käufer wurden anhand der Position im Dokument geraten – bitte Zuordnung und USt-IdNr. prüfen bzw. ergänzen (im Dokument nicht immer enthalten).",
        );
      }
      if (fields.totalAmount) {
        hints.push(
          `Erkannter Gesamtbetrag im Dokument: ${fields.totalAmount} € – bitte mit der Summe der Positionen unten vergleichen.`,
        );
      }
      setPdfMessage(hints.join(" "));
    } catch {
      setPdfStatus("error");
      setPdfMessage("Datei konnte nicht gelesen werden. Bitte fülle das Formular manuell aus.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrors([]);

    const payload = {
      invoiceNumber: form.invoiceNumber.trim(),
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      currency: form.currency.trim(),
      typeCode: "380",
      seller: { ...form.seller, vatId: form.seller.vatId.trim().toUpperCase() },
      buyer: { ...form.buyer, vatId: form.buyer.vatId.trim().toUpperCase() },
      lines: form.lines.map((line) => ({
        description: line.description.trim(),
        quantity: parseFloat(line.quantity.replace(",", ".")),
        unitCode: line.unitCode,
        unitPrice: parseFloat(line.unitPrice.replace(",", ".")),
        vatRate: parseFloat(line.vatRate.replace(",", ".")),
      })),
      iban: form.iban.replace(/\s/g, "").toUpperCase(),
      accountHolder: form.accountHolder.trim() || undefined,
      bic: form.bic.trim() || undefined,
      note: form.note.trim() || undefined,
    };

    try {
      const response = await fetch("/api/generate-xml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 422) {
        const data = await response.json();
        setErrors((data.issues ?? []).map((issue: { message: string }) => issue.message));
        setStatus("idle");
        return;
      }
      if (!response.ok) {
        setErrors(["Die XRechnung konnte nicht erzeugt werden. Bitte versuche es erneut."]);
        setStatus("idle");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xrechnung-${payload.invoiceNumber || "rechnung"}.xml`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("success");
    } catch {
      setErrors(["Die XRechnung konnte nicht erzeugt werden. Bitte versuche es erneut."]);
      setStatus("idle");
    }
  }

  return (
    <section id="tool" className="bg-[#f7f5f1] py-16">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">XRechnung erstellen</h2>
        <p className="mt-2 text-ink/70">
          Fülle die Pflichtfelder aus und lade deine XRechnung als XML herunter. Wir speichern
          deine Daten nicht.
        </p>

        <div className="mt-6 rounded-lg border border-dashed border-accent/50 bg-white p-5">
          <label className={labelClass()}>
            Rechnung hochladen (PDF, Word/DOCX oder TXT – optional, füllt Felder automatisch vor)
          </label>
          <input
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={handlePdfUpload}
            className="mt-2 block w-full text-sm text-ink/70 file:mr-4 file:rounded-md file:border-0 file:bg-ink file:px-4 file:py-2 file:text-white file:hover:bg-ink/80"
          />
          {pdfStatus === "loading" && (
            <p className="mt-2 text-sm text-ink/60">Datei wird gelesen…</p>
          )}
          {pdfMessage && (
            <p
              className={`mt-2 text-sm ${pdfStatus === "error" ? "text-red-600" : "text-accent"}`}
            >
              {pdfMessage}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-10">
          <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <legend className="mb-2 text-lg font-semibold text-ink">Rechnungsdaten</legend>
            <div>
              <label className={labelClass()}>Rechnungsnummer</label>
              <input
                className={inputClass()}
                value={form.invoiceNumber}
                onChange={(e) => setForm((p) => ({ ...p, invoiceNumber: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelClass()}>Rechnungsdatum</label>
              <input
                type="date"
                className={inputClass()}
                value={form.issueDate}
                onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelClass()}>Fälligkeitsdatum</label>
              <input
                type="date"
                className={inputClass()}
                value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                required
              />
            </div>
          </fieldset>

          <PartyFieldset
            title="Verkäufer (deine Firma)"
            value={form.seller}
            onChange={updateParty}
            target="seller"
            contactRequired
          />
          <PartyFieldset title="Käufer" value={form.buyer} onChange={updateParty} target="buyer" />

          <fieldset>
            <legend className="mb-3 text-lg font-semibold text-ink">Rechnungspositionen</legend>
            <div className="space-y-4">
              {form.lines.map((line, index) => (
                <div key={index} className="rounded-lg border border-ink/10 bg-white p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
                    <div className="sm:col-span-2">
                      <label className={labelClass()}>Leistungsbeschreibung</label>
                      <input
                        className={inputClass()}
                        value={line.description}
                        onChange={(e) => updateLine(index, "description", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass()}>Menge</label>
                      <input
                        className={inputClass()}
                        value={line.quantity}
                        onChange={(e) => updateLine(index, "quantity", e.target.value)}
                        inputMode="decimal"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass()}>Einheit</label>
                      <select
                        className={inputClass()}
                        value={line.unitCode}
                        onChange={(e) => updateLine(index, "unitCode", e.target.value)}
                      >
                        {UNIT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={`${labelClass()} whitespace-nowrap`}>Einzelpreis (netto)</label>
                      <input
                        className={inputClass()}
                        value={line.unitPrice}
                        onChange={(e) => updateLine(index, "unitPrice", e.target.value)}
                        inputMode="decimal"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass()}>USt-Satz (%)</label>
                      <input
                        className={inputClass()}
                        value={line.vatRate}
                        onChange={(e) => updateLine(index, "vatRate", e.target.value)}
                        inputMode="decimal"
                        required
                      />
                    </div>
                  </div>
                  {form.lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="mt-3 text-sm text-red-600 hover:underline"
                    >
                      Position entfernen
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addLine}
              className="mt-3 rounded-md border border-ink/20 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5"
            >
              + Position hinzufügen
            </button>
            <p className="mt-3 text-sm text-ink/60">
              Netto-Zwischensumme: {totalNet.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {form.currency}
            </p>
          </fieldset>

          <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <legend className="mb-2 text-lg font-semibold text-ink">Zahlung</legend>
            <div>
              <label className={labelClass()}>IBAN</label>
              <input
                className={inputClass()}
                value={form.iban}
                onChange={(e) => setForm((p) => ({ ...p, iban: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelClass()}>Kontoinhaber (optional)</label>
              <input
                className={inputClass()}
                value={form.accountHolder}
                onChange={(e) => setForm((p) => ({ ...p, accountHolder: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass()}>BIC (optional)</label>
              <input
                className={inputClass()}
                value={form.bic}
                onChange={(e) => setForm((p) => ({ ...p, bic: e.target.value }))}
              />
            </div>
          </fieldset>

          {errors.length > 0 && (
            <div className="rounded-md border border-red-300 bg-red-50 p-4">
              <p className="font-medium text-red-700">Bitte korrigiere folgende Angaben:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}
          {status === "success" && (
            <p className="text-sm font-medium text-accent">
              Deine XRechnung wurde erzeugt und heruntergeladen. Bitte vor dem Versand prüfen.
            </p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-md bg-accent px-6 py-3 text-base font-medium text-white transition hover:bg-accent-light disabled:opacity-60 sm:w-auto"
          >
            {status === "submitting" ? "Wird erzeugt…" : "XRechnung als XML herunterladen"}
          </button>
        </form>
      </div>
    </section>
  );
}

function PartyFieldset({
  title,
  value,
  onChange,
  target,
  contactRequired = false,
}: {
  title: string;
  value: PartyForm;
  onChange: (target: "seller" | "buyer", field: keyof PartyForm, value: string) => void;
  target: "seller" | "buyer";
  contactRequired?: boolean;
}) {
  return (
    <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <legend className="mb-2 text-lg font-semibold text-ink">{title}</legend>
      <div className="sm:col-span-2">
        <label className={labelClass()}>Name / Firma</label>
        <input
          className={inputClass()}
          value={value.name}
          onChange={(e) => onChange(target, "name", e.target.value)}
          required
        />
      </div>
      <div>
        <label className={labelClass()}>USt-IdNr.</label>
        <input
          className={inputClass()}
          value={value.vatId}
          onChange={(e) => onChange(target, "vatId", e.target.value)}
          placeholder="DE123456789"
          required
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass()}>Straße und Hausnummer</label>
        <input
          className={inputClass()}
          value={value.street}
          onChange={(e) => onChange(target, "street", e.target.value)}
          required
        />
      </div>
      <div>
        <label className={labelClass()}>PLZ</label>
        <input
          className={inputClass()}
          value={value.postcode}
          onChange={(e) => onChange(target, "postcode", e.target.value)}
          required
        />
      </div>
      <div>
        <label className={labelClass()}>Ort</label>
        <input
          className={inputClass()}
          value={value.city}
          onChange={(e) => onChange(target, "city", e.target.value)}
          required
        />
      </div>
      <div>
        <label className={labelClass()}>Land</label>
        <input
          className={inputClass()}
          value={value.countryCode}
          onChange={(e) => onChange(target, "countryCode", e.target.value.toUpperCase())}
          maxLength={2}
          required
        />
      </div>
      <div>
        <label className={labelClass()}>{contactRequired ? "E-Mail" : "E-Mail (optional)"}</label>
        <input
          type="email"
          className={inputClass()}
          value={value.email}
          onChange={(e) => onChange(target, "email", e.target.value)}
          required={contactRequired}
        />
      </div>
      <div>
        <label className={labelClass()}>{contactRequired ? "Telefonnummer" : "Telefonnummer (optional)"}</label>
        <input
          type="tel"
          className={inputClass()}
          value={value.phone}
          onChange={(e) => onChange(target, "phone", e.target.value)}
          placeholder="+49 911 1234567"
          required={contactRequired}
        />
      </div>
      <div>
        <label className={labelClass()}>Schema der E-Rechnungs-Adresse</label>
        <select
          className={inputClass()}
          value={value.electronicAddressScheme}
          onChange={(e) => onChange(target, "electronicAddressScheme", e.target.value)}
        >
          {ELECTRONIC_ADDRESS_SCHEMES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-3">
        <label className={labelClass()}>E-Rechnungs-Adresse (Peppol-Zustellung)</label>
        <input
          className={inputClass()}
          value={value.electronicAddress}
          onChange={(e) => onChange(target, "electronicAddress", e.target.value)}
          placeholder="z. B. deine E-Mail-Adresse"
          required
        />
        <p className="mt-1 text-xs text-ink/50">
          Wird als elektronische Empfangsadresse in der XRechnung hinterlegt (cbc:EndpointID). Bei
          Schema &bdquo;E-Mail-Adresse&ldquo; einfach die E-Mail eintragen.
        </p>
      </div>
    </fieldset>
  );
}
