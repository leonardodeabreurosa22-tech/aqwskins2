import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translations
import enTranslations from "./locales/en/common.json";
import ptBRTranslations from "./locales/pt-BR/common.json";
import esTranslations from "./locales/es/common.json";
import filTranslations from "./locales/fil/common.json";

const resources = {
  en: {
    translation: enTranslations,
  },
  "pt-BR": {
    translation: ptBRTranslations,
  },
  es: {
    translation: esTranslations,
  },
  fil: {
    translation: filTranslations,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "pt-BR", "es", "fil"],

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;
