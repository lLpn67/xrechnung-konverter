import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://xrechnung-konverter.de";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "XRechnung kostenlos erstellen | E-Rechnung Pflicht 2027/2028",
  description:
    "Kostenlos zur XRechnung – in 2 Minuten, ohne Anmeldung. Erfülle die E-Rechnungspflicht (XRechnung/ZUGFeRD, EN 16931) ab 2027/2028 mit einem einfachen Online-Tool für kleine Unternehmen und Steuerberater.",
  keywords: [
    "XRechnung Pflicht",
    "XRechnung kostenlos erstellen",
    "E-Rechnung 2027",
    "E-Rechnung 2028 Pflicht",
    "EN 16931",
    "ZUGFeRD",
  ],
  openGraph: {
    title: "XRechnung kostenlos erstellen | E-Rechnung Pflicht 2027/2028",
    description:
      "Kostenlos zur XRechnung – in 2 Minuten, ohne Anmeldung. Für kleine Unternehmen und Steuerberater.",
    url: siteUrl,
    siteName: "XRechnung-Konverter",
    locale: "de_DE",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
