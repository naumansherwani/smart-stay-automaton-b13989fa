import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { User } from "@supabase/supabase-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type UserLike = Pick<User, "email" | "user_metadata"> | null | undefined;

const readString = (value: unknown) => typeof value === "string" && value.trim().length > 0 ? value : null;

export function getUserAvatarUrl(user: UserLike, profileAvatar?: string | null) {
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;

  return readString(profileAvatar)
    ?? readString(metadata?.avatar_url)
    ?? readString(metadata?.picture)
    ?? readString(metadata?.photo_url)
    ?? readString(metadata?.image)
    ?? null;
}

export function getUserDisplayName(user: UserLike, profileName?: string | null) {
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;

  return readString(profileName)
    ?? readString(metadata?.full_name)
    ?? readString(metadata?.name)
    ?? readString(metadata?.given_name)
    ?? readString(user?.email?.split("@")[0])
    ?? "User";
}

export function getUserInitials(name?: string | null, email?: string | null) {
  const source = readString(name) ?? readString(email?.split("@")[0]) ?? "User";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
