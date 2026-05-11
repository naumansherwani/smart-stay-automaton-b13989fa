---
name: Neural Halo Identity System
description: User profile photo as identity layer across all surfaces with industry-colored halo
type: feature
---
**Component**: `src/components/identity/UserHalo.tsx` — single source of identity UI.
Props: size, industry (defaults to active workspace), pulse (idle/streaming/sherlock/resolved), founderBadge, onClick.

**Storage**: private bucket `profile-avatars` (5MB, jpg/png/webp). RLS scoped to user folder; admins can read all.
**Column**: `profiles.avatar_path` (storage path). Existing `profiles.avatar_url` left untouched (legacy).
**Resolution**: `useAvatarSignedUrl(path)` returns short-lived (1h) signed URL with auto-refresh.

**Halo colors**: pulled from `advisorConfig[industry].auraHsl` — never duplicate.
**Animations**: 4 keyframes in `index.css` (halo-breath, halo-pulse, halo-gold-flash, halo-green-pulse).

**Mounted**:
- FloatingAdvisorChat header (replaces Sparkles icon)
- AppLayout top bar (right side, founderBadge for admins)
- FounderHeader (replaces Crown button, founderBadge=true)

**Upload**: `src/pages/Profile.tsx` → uploads to `profile-avatars/{user_id}/avatar.{ext}`, stores path in `avatar_path`.

**Privacy**: photo never publicly accessible. Mood detection NOT implemented (opt-in future only).
