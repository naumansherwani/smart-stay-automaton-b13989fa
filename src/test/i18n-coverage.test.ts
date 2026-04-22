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

// Critical namespaces — these MUST be 100% translated in every locale.
// Other keys (e.g. extended landing-page copy) gracefully fall back to en.
const CRITICAL_NAMESPACES = ["nav", "common", "dashboard", "settings", "pricing", "footer", "notifications"];

describe("i18n locale coverage", () => {
  const enKeys = flatten(en);
  const enKeySet = new Set(enKeys);
  const criticalKeys = enKeys.filter((k) => CRITICAL_NAMESPACES.some((ns) => k.startsWith(ns + ".")));

  it("baseline (en) is non-empty", () => {
    expect(enKeys.length).toBeGreaterThan(50);
    expect(criticalKeys.length).toBeGreaterThan(20);
  });

  it("all 15 locales (incl. en) are registered", () => {
    expect(Object.keys(LOCALES).length + 1).toBe(15);
  });

  for (const [code, locale] of Object.entries(LOCALES)) {
    const localeKeys = new Set(flatten(locale));
    const missingCritical = criticalKeys.filter((k) => !localeKeys.has(k));
    const missingTotal = enKeys.filter((k) => !localeKeys.has(k));
    const coverage = ((enKeys.length - missingTotal.length) / enKeys.length) * 100;

    it(`${code} — covers all CRITICAL keys (nav/common/dashboard/settings/pricing/footer/notifications)`, () => {
      if (missingCritical.length) {
        console.warn(`[${code}] missing critical keys:`, missingCritical);
      }
      expect(missingCritical).toEqual([]);
    });

    it(`${code} — coverage report (${coverage.toFixed(1)}% of ${enKeys.length} keys)`, () => {
      console.log(`[${code}] coverage: ${coverage.toFixed(1)}% — ${enKeys.length - missingTotal.length}/${enKeys.length} keys (extras fall back to English)`);
      expect(coverage).toBeGreaterThanOrEqual(20);
    });

    it(`${code} — has no empty translation strings`, () => {
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
