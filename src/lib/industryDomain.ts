import type { IndustryType } from "@/lib/industryConfig";

/**
 * Owner-locked May 2026: each industry runs on its own subdomain of
 * hostflowai.net. Root domain hosts the landing + industry chooser only.
 *
 *   hostflowai.net            → landing (no industry locked)
 *   www.hostflowai.net        → landing
 *   hospitality.hostflowai.net
 *   airlines.hostflowai.net
 *   car-rental.hostflowai.net
 *   healthcare.hostflowai.net
 *   education.hostflowai.net
 *   logistics.hostflowai.net
 *   events.hostflowai.net          (events_entertainment)
 *   railways.hostflowai.net
 *
 * Founder/Owner console stays on the root domain.
 */

export const ROOT_DOMAIN = "hostflowai.net";

// subdomain → IndustryType
export const SUBDOMAIN_TO_INDUSTRY: Record<string, IndustryType> = {
  hospitality: "hospitality",
  airlines: "airlines",
  "car-rental": "car_rental",
  healthcare: "healthcare",
  education: "education",
  logistics: "logistics",
  events: "events_entertainment",
  railways: "railways",
};

// IndustryType → subdomain label
export const INDUSTRY_TO_SUBDOMAIN: Record<IndustryType, string> = {
  hospitality: "hospitality",
  airlines: "airlines",
  car_rental: "car-rental",
  healthcare: "healthcare",
  education: "education",
  logistics: "logistics",
  events_entertainment: "events",
  railways: "railways",
};

/** Hosts where industry subdomains should NOT be applied (preview / local). */
function isPreviewOrLocalHost(host: string): boolean {
  return (
    host === "localhost" ||
    host.startsWith("127.") ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com")
  );
}

/** Return the industry locked by the current hostname, or null on root/preview. */
export function getIndustryFromHost(host?: string): IndustryType | null {
  if (typeof window === "undefined" && !host) return null;
  const h = (host ?? window.location.hostname).toLowerCase();
  if (isPreviewOrLocalHost(h)) return null;
  if (h === ROOT_DOMAIN || h === `www.${ROOT_DOMAIN}`) return null;
  if (!h.endsWith(`.${ROOT_DOMAIN}`)) return null;
  const sub = h.slice(0, -1 - ROOT_DOMAIN.length); // strip ".hostflowai.net"
  return SUBDOMAIN_TO_INDUSTRY[sub] ?? null;
}

/** Build the absolute URL for a given industry + path. */
export function getIndustrySubdomainUrl(industry: IndustryType, path = "/"): string {
  const sub = INDUSTRY_TO_SUBDOMAIN[industry];
  const safePath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window === "undefined") {
    return `https://${sub}.${ROOT_DOMAIN}${safePath}`;
  }
  const host = window.location.hostname.toLowerCase();
  // On preview / local we don't have real subdomains — stay on same host,
  // and forward the industry via query so signup/login can lock it.
  if (isPreviewOrLocalHost(host)) {
    const sep = safePath.includes("?") ? "&" : "?";
    return `${window.location.origin}${safePath}${sep}industry=${industry}`;
  }
  return `https://${sub}.${ROOT_DOMAIN}${safePath}`;
}

/** Root landing URL (industry chooser). */
export function getRootUrl(path = "/"): string {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window === "undefined") return `https://${ROOT_DOMAIN}${safePath}`;
  const host = window.location.hostname.toLowerCase();
  if (isPreviewOrLocalHost(host)) return `${window.location.origin}${safePath}`;
  return `https://${ROOT_DOMAIN}${safePath}`;
}

/**
 * Resolve the locked industry for the current page using (in order):
 *   1. hostname subdomain
 *   2. ?industry= query param (preview fallback)
 *   3. sessionStorage("preselected_industry")
 *   4. localStorage("preselected_industry")
 */
export function getLockedIndustry(): IndustryType | null {
  if (typeof window === "undefined") return null;
  const fromHost = getIndustryFromHost();
  if (fromHost) return fromHost;
  try {
    const url = new URL(window.location.href);
    const q = (url.searchParams.get("industry") || "").toLowerCase() as IndustryType;
    if (q && (Object.values(INDUSTRY_TO_SUBDOMAIN) as string[]).length && isIndustry(q)) return q;
  } catch { /* ignore */ }
  try {
    const s = (sessionStorage.getItem("preselected_industry") || "") as IndustryType;
    if (isIndustry(s)) return s;
    const l = (localStorage.getItem("preselected_industry") || "") as IndustryType;
    if (isIndustry(l)) return l;
  } catch { /* ignore */ }
  return null;
}

function isIndustry(x: string): x is IndustryType {
  return Object.prototype.hasOwnProperty.call(INDUSTRY_TO_SUBDOMAIN, x);
}

/** Pretty display label for an industry. */
export function industryLabel(industry: IndustryType): string {
  switch (industry) {
    case "hospitality": return "Travel, Tourism & Hospitality";
    case "airlines": return "Airlines";
    case "car_rental": return "Car Rental";
    case "healthcare": return "Healthcare";
    case "education": return "Education";
    case "logistics": return "Logistics";
    case "events_entertainment": return "Events & Entertainment";
    case "railways": return "Railways";
  }
}