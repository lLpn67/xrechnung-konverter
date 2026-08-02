// Angaben gemäß § 5 DDG (vormals TMG). NICHTS hier erfinden oder ergänzen,
// das nicht ausdrücklich von Nils bestätigt wurde – lieber als "offen"
// markiert lassen, als eine falsche/geratene Angabe zu veröffentlichen.
//
// street und postcode sind aktuell absichtlich leer, weil sie noch nicht
// mitgeteilt wurden. Sobald sie feststehen, hier eintragen – die Warnung
// auf /impressum verschwindet dann automatisch.

export const IMPRESSUM_DATA = {
  name: "Nils Bernhard",
  street: "", // TODO: Straße und Hausnummer eintragen, sobald bekannt
  postcode: "", // TODO: Postleitzahl eintragen, sobald bekannt
  city: "Nürnberg",
  country: "Deutschland",
  email: "nilsjbernhard@icloud.com",
};

export const DISPUTE_RESOLUTION_TEXT = [
  "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit.",
  "Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
];

export const DISPUTE_RESOLUTION_URL = "https://ec.europa.eu/consumers/odr/";

export const LIABILITY_TEXT = [
  "Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.",
  "Die auf dieser Seite erzeugten XRechnungen werden ohne Gewähr auf vollständige Konformität mit dem EN-16931-Standard bereitgestellt. Diese Seite ersetzt keine Steuerberatung. Bitte prüfen Sie erzeugte Dokumente vor dem Versand.",
];

export function isAddressComplete(): boolean {
  return IMPRESSUM_DATA.street.trim().length > 0 && IMPRESSUM_DATA.postcode.trim().length > 0;
}
