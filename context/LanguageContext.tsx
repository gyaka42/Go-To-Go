// context/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import en from "../locales/en.json";
import nl from "../locales/nl.json";
import tr from "../locales/tr.json";
import de from "../locales/de.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";

const translations = { en, nl, tr, de, es, fr };

type Lang = "en" | "nl" | "tr" | "de" | "es" | "fr";

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "nl",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("nl");

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    AsyncStorage.setItem("lang", newLang);
  };

  useEffect(() => {
    (async () => {
      const storedLang = await AsyncStorage.getItem("lang");
      if (
        storedLang === "en" ||
        storedLang === "nl" ||
        storedLang === "tr" ||
        storedLang === "de" ||
        storedLang === "es" ||
        storedLang === "fr"
      ) {
        setLangState(storedLang as Lang);
      } else {
        const deviceLang = Localization.locale.split("-")[0];
        if (
          deviceLang === "en" ||
          deviceLang === "nl" ||
          deviceLang === "tr" ||
          deviceLang === "de" ||
          deviceLang === "es" ||
          deviceLang === "fr"
        ) {
          setLangState(deviceLang as Lang);
        } else {
          setLangState("nl");
        }
      }
    })();
  }, []);

  const t = (key: string, vars?: Record<string, string>) => {
    let str = translations[lang][key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{{${k}}}`, v);
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
