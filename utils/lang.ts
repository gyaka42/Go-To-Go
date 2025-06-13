// utils/lang.ts
import * as Localization from "expo-localization";
import en from "../locales/en.json";
import nl from "../locales/nl.json";
import tr from "../locales/tr.json";
import de from "../locales/de.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";

// Beschikbare resources
const resources = { en, nl, tr, de, es, fr };

// Start-taal: device-instelling, of fallback op NL
let current =
  (Localization.locale.split("-")[0] as
    | "en"
    | "nl"
    | "tr"
    | "de"
    | "es"
    | "fr") || "nl";

// Vertaalfunctie
export function t(key: string, vars?: Record<string, string>): string {
  // haal string op, of default op key
  let str = resources[current][key] ?? key;
  // interpolate {{name}} → waarde
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{{${k}}}`, v);
    });
  }
  return str;
}

// Hulp om taal te veranderen
export function setLanguage(lang: "en" | "nl" | "tr" | "de" | "es" | "fr") {
  current = lang;
}

// Hulp om huidige taal op te vragen
export function getLanguage(): "en" | "nl" | "tr" | "de" | "es" | "fr" {
  return current;
}
