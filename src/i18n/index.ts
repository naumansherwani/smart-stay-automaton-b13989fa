import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import ur from "./locales/ur.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";
import zh from "./locales/zh.json";
import pt from "./locales/pt.json";
import de from "./locales/de.json";
import deCH from "./locales/de-CH.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import tr from "./locales/tr.json";
import it from "./locales/it.json";
import ro from "./locales/ro.json";

export const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "ur", name: "اردو", flag: "🇵🇰" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "de-CH", name: "Schweizerdeutsch", flag: "🇨🇭" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "ro", name: "Română", flag: "🇷🇴" },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, hi: { translation: hi }, ur: { translation: ur }, es: { translation: es }, fr: { translation: fr }, ar: { translation: ar }, zh: { translation: zh }, pt: { translation: pt }, de: { translation: de }, "de-CH": { translation: deCH }, ja: { translation: ja }, ko: { translation: ko }, tr: { translation: tr }, it: { translation: it }, ro: { translation: ro } },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
  });

export default i18n;
