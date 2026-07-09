# Accessibility Guidelines — WCAG 2.2 AA

Lynk targets **WCAG 2.2 Level AA**. This is the standard every new screen and
component in this project is expected to meet. The design tokens and shared
components in this folder are built to make compliance the default — if you
build with them, most criteria are handled for you.

## Colour & contrast (1.4.3, 1.4.11)

- **Body / UI text** must clear **4.5:1** against its background; large text
  (≥24px, or ≥19px bold) and non-text UI (icons, borders, dots) must clear **3:1**.
- Every colour token in [`tokens.css`](./tokens.css) has been contrast-checked.
  Use the semantic pairs, not raw values:
  - **Coloured text / badges** → use `-ink` on `-soft`
    (e.g. `text-critical-ink` on `bg-critical-soft`). These clear 5.7:1+.
  - **Dots, bars, chart fills** (non-text) → use the vibrant base
    (e.g. `bg-critical`). These clear 3:1.
  - **Solid buttons** with white text use tokens tuned to clear 4.5:1
    (`--primary`, `--destructive`, `--success`, `--accent`).
- The `-soft` / `-ink` pairs are derived from each base colour via `color-mix`,
  so **changing a base colour keeps its badge accessible automatically**.

## Keyboard & focus (2.1.1, 2.4.7, 2.4.11)

- All interactive elements are real `<button>` / `<input>` / `<select>`, so they
  are keyboard-operable by default. Do **not** put click handlers on plain
  `<div>`s.
- A global `:focus-visible` ring (2px `--ring`, 2px offset) is defined in
  [`index.css`](../index.css). Don't remove outlines without replacing them.
- Keep focused elements clear of sticky headers/overlays (2.4.11 Focus Not
  Obscured).

## Target size (2.5.8) & pointer (2.5.7)

- Interactive targets should be at least **24×24 CSS px**. The shared `Button`,
  `Pill`, and stepper controls already meet this. Give small icon-only buttons
  adequate padding.
- Don't make any action **drag-only** (2.5.7) — provide a click/tap alternative.

## Forms & content (1.1.1, 1.3.1, 3.3.x, 4.1.2)

- Every input needs a visible `<label>` or `aria-label` (3.3.2).
- Identify errors in text, not colour alone (3.3.1, 1.4.1).
- Don't force re-entry of info the user already gave in the same flow (3.3.7
  Redundant Entry).
- Give meaningful images/icons alt text; decorative ones `alt=""` (1.1.1).
- Use semantic headings and landmarks so structure is conveyed non-visually
  (1.3.1).

## What automated checks catch (~30%)

The token contrast is verified, but **automated checks are not enough**. Before
handoff, also:

1. Navigate the screen **keyboard-only** (Tab / Shift+Tab / Enter / Esc).
2. Test with a screen reader (VoiceOver on macOS, NVDA on Windows).
3. Zoom to **200%** — layout must not break or clip content.

## Current status

The colour system passes AA contrast across all token combinations (verified
against text, badge, button, and non-text thresholds). Outstanding manual items
for any production hardening: full screen-reader pass, and confirming every
icon-only control meets the 24px target minimum.
