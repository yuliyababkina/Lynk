/*
 * The one place an avatar's colour is decided. Components ask for a user's
 * tone and get class names back; no colour logic lives in a component.
 *
 * The colour comes from the user id, not their position in a list or their
 * name, so the same person keeps the same colour on every row, in the picker
 * and in the drawer — and keeps it if they are renamed.
 *
 * Tokens: --avatar-1 … --avatar-8 in src/styles/tokens.css, used through their
 * -soft (tint) / -ink (initials) pair. Written out in full so Tailwind sees
 * every class.
 */
const AVATAR_TONES = [
  "bg-avatar-1-soft text-avatar-1-ink",
  "bg-avatar-2-soft text-avatar-2-ink",
  "bg-avatar-3-soft text-avatar-3-ink",
  "bg-avatar-4-soft text-avatar-4-ink",
  "bg-avatar-5-soft text-avatar-5-ink",
  "bg-avatar-6-soft text-avatar-6-ink",
  "bg-avatar-7-soft text-avatar-7-ink",
  "bg-avatar-8-soft text-avatar-8-ink",
] as const;

/** FNV-1a: tiny, stable, and spreads short similar ids (u-…) well. */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (const ch of value) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Which of the eight avatar colours (1–8) belongs to this user. */
export function avatarToneIndex(userId: string): number {
  return (hash(userId) % AVATAR_TONES.length) + 1;
}

/** Background + text classes for a user's initials avatar. */
export function avatarToneClass(userId: string): string {
  return AVATAR_TONES[avatarToneIndex(userId) - 1];
}
