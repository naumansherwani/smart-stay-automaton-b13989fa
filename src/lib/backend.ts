/**
 * Replit Backend (Brain) endpoint.
 *
 * This is the single source of truth for the backend URL.
 * To change the backend URL in the future, update only this file.
 *
 * Usage:
 *   import { BACKEND_URL, backendFetch } from "@/lib/backend";
 *
 * NOTE: Nothing in the existing app imports this yet — it is a passive
 * helper. Existing UI, flows, and pages are untouched.
 */

export const BACKEND_URL =
  "https://294617d8-2084-4895-8e41-8e7fdf1efde4-00-37kl744l50epn.riker.replit.dev/api";

/**
 * Thin fetch wrapper that prepends BACKEND_URL to a path.
 * Example: backendFetch("/rapidpay/session", { method: "POST", body: ... })
 */
export async function backendFetch(path: string, init: RequestInit = {}) {
  const url = path.startsWith("http")
    ? path
    : `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;

  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}