import { REPLIT_ORIGIN } from "@/lib/replitBase";

// Replit AI Email backend base URL.
// Public on purpose — auth is enforced via Supabase JWT on the Replit side.
// Override at build time with VITE_REPLIT_INBOX_URL.
export const REPLIT_INBOX_URL = REPLIT_ORIGIN;

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