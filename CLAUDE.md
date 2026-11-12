# AGENTS.md — Lynk

Instructions for AI assistants (Claude Code, Cursor, Copilot, v0…) working in this repo. Read it before writing code. `CLAUDE.md` is a copy of this file — edit both together.

Stack: React 18 + Vite + Tailwind v4 + shadcn (radix) · Supabase · Vercel. Solo project, owned by a product designer — UI is built directly in code.

## 1. Where things live

| Path | What | Rules |
|---|---|---|
| `src/components/ui/` | shadcn generated code | Editable: `cva` variants, className values. Leave Radix wiring, `data-slot` and prop plumbing alone. Add with `npx shadcn add <name>`, never by hand. |
| `src/components/yarowa/` | Our own components | Library first (§3). Each needs a `@custom` header and a `Custom/<Name>` story. |
| `src/pages/`, `src/pages/portal/`, `src/shell/` | Screens and the platform shell | Compose `ui/` + `yarowa/`. No hand-rolled controls. |
| `src/shared/ui/typography.tsx` | `Heading` / `Text` — the type scale | The one place type sizes are defined. |
| `src/index.css` | shadcn preset (base tokens, dark mode, radius) | Preset-managed. Don't add colours here. |
| `src/styles/tokens.css` | Our semantic tokens (`--critical`, `-soft`/`-ink` pairs, `--yarowa-green`…) | **The only place raw colour values are allowed.** |
| `src/lib/`, `src/hooks/` | Utilities and data/i18n plumbing; `src/hooks` is written by the shadcn CLI | Put your own hooks in `src/shared/hooks/`. |

## 2. Building with shadcn

- **Compose from `@/components/ui`, don't rebuild it.** `react/forbid-elements` errors on raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<label>`, the `<table>` family, `<hr>`, `<dialog>`, `<progress>`, `<kbd>` in hand-written code. Use the component named in the error.
- **Raw HTML for text and layout is fine:** `<h1>`–`<h6>`, `<p>`, `<ul>`/`<li>`, `<div>`, `<span>`, `<section>`, `<nav>`, `<a>`, `<img>`, `<form>`.
- **`className` with Tailwind utilities. The `style` prop is a lint error.** Fixed positioning, z-index, widths are utilities.
- **Semantic tokens only:** `bg-primary`, `text-muted-foreground`, `border-input`, `bg-critical-soft`. Raw palette utilities (`bg-blue-500`), literal colours (`#4C8A14`, `oklch(…)`), arbitrary colours (`bg-[#fff]`) and `bg-white`/`text-black` are lint errors. Arbitrary **sizes** (`w-[340px]`) are fine. A new colour is a new token in `src/styles/tokens.css`.
- **Look up the API, don't guess it:** `npx shadcn docs <component> -b radix`.
- **Use the components' own state props:** `disabled`, `aria-invalid`, `<Skeleton>`, `<Spinner>`.
- **Extract on the second use.** Markup another screen already has moves to `src/components/yarowa/` (or `src/shared/ui/`); never copy a screen and edit 5% of it.
- **Never silence a rule with `// eslint-disable`.** `noInlineConfig` ignores it in hand-written code and reports it, so it fails lint anyway. If a rule blocks you, report it instead.

## 3. Library first (custom components)

Before adding anything to `src/components/yarowa/`, go down this list and stop at the first that works:

1. An installed shadcn component, with a different variant or className.
2. A shadcn component not installed yet — `npx shadcn add <name>`.
3. A composition of installed components in the screen itself.
4. Only then: a custom component in `src/components/yarowa/`.

A custom component must carry this header, stating why 1–3 were not enough, and who signed it off:

```tsx
/**
 * @custom   Why no shadcn component or composition covers this.
 * @approved <name>, <YYYY-MM-DD>
 */
```

It also needs a Storybook story titled **`Custom/<Name>`** (e.g. `Custom/Alert Banner`) covering its variants and states. Don't add a custom component without both; ask for the approval instead of writing `@approved` yourself.

`npm run check:custom` enforces both for every `.tsx` in `src/components/yarowa/` (the pre-commit hook checks the staged ones, CI checks all). Existing components and `Product Components/…` stories predate the rule and fail it until they get their header and a `Custom/…` story.

## 4. Typography

UI text — screen titles, section headings, helper text — uses `<Heading>` and `<Text>` from `@/shared/ui/typography`. Don't write `text-2xl font-semibold` by hand: that is the type scale drifting outside the design system. Lint enforces it (`lynk/type-scale`): a text size and a font weight in the same class string is an error everywhere except `typography.tsx`. A size alone or a weight alone is fine. If no level or variant fits, add one to `typography.tsx`. Raw `<h1>`/`<p>`/`<ul>` stay correct for prose blocks.

## 5. i18n

Lynk ships in English and German. **Every user-facing string goes through `useI18n`** — `const { t } = useI18n()` from `@/lib/i18n`, then `t("Scheduled exports")`, with `{name}` placeholders for values: `t("{n} documents", { n })`. The English source string is the key; add its German translation to the `DE` map in `src/lib/i18n.tsx` in the same change. No hardcoded user-facing text in JSX, `aria-label`, `placeholder`, `title`, `alt`, `label`, `subtitle`, `description` or toasts. Lint enforces it (`lynk/no-literal-string`) outside stories; `Lynk`, `Yarowa` and the language names in the switcher are allowed as-is.

## 6. Reviewing and checks

- `npm run dev` (app, `:5173`) · `npm run storybook` (`:6006`).
- `npm run lint` — ESLint, `--max-warnings=0`. `npm run typecheck` — `tsc --noEmit`. `npm run check:custom` — custom component headers and stories. `npm test` — unit tests.
- Pre-commit runs lint, the custom component check (staged files) and typecheck. GitHub Actions (`.github/workflows/checks.yml`) runs all checks plus the build on the whole codebase for every PR and push to `main`.
- Lint tiers: **vendored** (`src/components/ui/**`, `src/hooks/**`) gets the colour rules only; **authored** (`src/pages/**`, `src/components/yarowa/**`, `src/shell/**`, `src/shared/**`, `src/stories/**`) gets the full set. The rules live in `eslint.presentation.js`.
- Supabase schema changes cannot be run from an agent session (anon key only): write the migration, the user pastes it into the SQL Editor.

## 7. Required prefix for UI prompts

When building or changing UI, work to this brief every time:

> ROLE: Product designer's pair, building the Lynk UI in code. You may modify: src/components/ui, src/components/yarowa, src/pages, src/shell, src/shared, src/stories, src/styles/tokens.css.
> Build EVERYTHING from shadcn/ui components in @/components/ui. Install what's missing with `npx shadcn add <name>`; never hand-roll a control shadcn provides. Check props with `npx shadcn docs <component> -b radix` instead of guessing.
> Library first: variant/className → `shadcn add` → compose → only then a custom component in src/components/yarowa, with a `@custom`/`@approved` header and a `Custom/<Name>` story.
> Style with className and Tailwind utilities ONLY. The `style` prop is banned.
> Colour comes from semantic tokens (bg-primary, text-muted-foreground, bg-critical-soft). No raw palette utilities, no literal colours, no arbitrary colour values, no bg-white/text-black. New colours go in src/styles/tokens.css. Arbitrary sizes like w-[340px] are fine.
> UI text uses <Heading> and <Text> from @/shared/ui/typography. Raw <h1>/<p>/<ul> stay correct for prose blocks.
> Every user-facing string goes through `useI18n` (`t("…")`), with the German entry added to the DE map in src/lib/i18n.tsx.
> Extract on the SECOND use. Never copy a screen and edit 5% of it.
> Never add `// eslint-disable`. If a rule blocks you, stop and report it.
