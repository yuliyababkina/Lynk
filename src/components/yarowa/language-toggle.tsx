import { useI18n, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * Compact EN | DE segmented toggle for the header. One click flips language,
 * the active one stays highlighted. `tone="dark"` adapts it to the brand-navy
 * header; `tone="light"` for light surfaces.
 */
const LANGS: Lang[] = ["en", "de"];

export function LanguageToggle({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "inline-flex items-center rounded-full p-0.5 text-[11px] font-semibold",
        tone === "dark" ? "bg-white/10" : "bg-secondary"
      )}
    >
      {LANGS.map((l) => {
        const active = lang === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={active}
            className={cn(
              "px-2 py-0.5 rounded-full uppercase tracking-wide transition-colors",
              active
                ? tone === "dark"
                  ? "bg-white text-brand-navy"
                  : "bg-card text-foreground shadow-sm"
                : tone === "dark"
                  ? "text-white/60 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
