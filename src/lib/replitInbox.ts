// Replit AI Email backend base URL.
// Public on purpose — auth is enforced via Supabase JWT on the Replit side.
// Override at build time with VITE_REPLIT_INBOX_URL.
export const REPLIT_INBOX_URL =
  (import.meta.env.VITE_REPLIT_INBOX_URL as string | undefined) ||
  "https://294617d8-2084-4895-8e41-8e7fdf1efde4-00-37kl744l50epn.riker.replit.dev";

export interface ReplitInboxEmail {
  id: number;
  fromEmail: string;
  fromName: string;
  toAddress: string;
  subject: string;
  body?: string;
  preview?: string;
  aiReply?: string;
  advisorName: string;
  industry: string;
  isRead: boolean;
  receivedAt: string;
}