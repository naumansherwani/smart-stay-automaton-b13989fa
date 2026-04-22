import { describe, it, expect } from "vitest";
import en from "../i18n/locales/en.json";
import hi from "../i18n/locales/hi.json";
import ur from "../i18n/locales/ur.json";
import ar from "../i18n/locales/ar.json";
import es from "../i18n/locales/es.json";
import fr from "../i18n/locales/fr.json";
import de from "../i18n/locales/de.json";
import deCH from "../i18n/locales/de-CH.json";
import pt from "../i18n/locales/pt.json";
import zh from "../i18n/locales/zh.json";
import ja from "../i18n/locales/ja.json";
import ko from "../i18n/locales/ko.json";
import tr from "../i18n/locales/tr.json";
import itLocale from "../i18n/locales/it.json";
import ro from "../i18n/locales/ro.json";

const flatten = (obj: any, prefix = ""): string[] => {
  const keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
      keys.push(...flatten(obj[k], path));
    } else {
      keys.push(path);
    }
  }
  return keys;
};

const LOCALES: Record<string, any> = {
  hi, ur, ar, es, fr, de, "de-CH": deCH, pt, zh, ja, ko, tr, it: itLocale, ro,
};

describe("i18n locale coverage", () => {
  const baseline = new Set(flatten(en));

  it("baseline (en) has at least 50 keys", () => {
    expect(baseline.size).toBeGreaterThan(50);
  });

  for (const [code, locale] of Object.entries(LOCALES)) {
    it(`${code} has every key from en.json`, () => {
      const localeKeys = new Set(flatten(locale));
      const missing = [...baseline].filter((k) => !localeKeys.has(k));
      if (missing.length) {
        console.warn(`[${code}] missing ${missing.length} keys:`, missing.slice(0, 10));
      }
      expect(missing).toEqual([]);
    });

    it(`${code} has no empty translations`, () => {
      const empties: string[] = [];
      const walk = (obj: any, prefix = "") => {
        for (const k of Object.keys(obj)) {
          const path = prefix ? `${prefix}.${k}` : k;
          const v = obj[k];
          if (v && typeof v === "object" && !Array.isArray(v)) walk(v, path);
          else if (typeof v === "string" && v.trim() === "") empties.push(path);
        }
      };
      walk(locale);
      expect(empties).toEqual([]);
    });
  }
});
