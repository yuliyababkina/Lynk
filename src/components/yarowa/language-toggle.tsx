import { useI18n } from "@/lib/i18n-context";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/*
 * Compact EN | DE segmented toggle for the header. One click flips language,
 * the active one stays highlighted. `tone="dark"` adapts it to the brand-navy
 * header; `tone="light"` for light surfaces.
 */
const LANGS: Lang[] = ["en", "de"];

export function LanguageToggle({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("Language")}
      className={cn(
        "inline-flex items-center rounded-full p-0.5 text-[11px] font-semibold",
        tone === "dark" ? "bg-brand-navy-foreground/10" : "bg-secondary"
      )}
    >
      {LANGS.map((l) => {
        const active = lang === l;
        return (
          <Button
            key={l}
            type="button"
            variant="ghost"
            onClick={() => setLang(l)}
            aria-pressed={active}
            className={cn(
              "h-auto rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide hover:bg-transparent dark:hover:bg-transparent",
              active
                ? tone === "dark"
                  ? "bg-brand-navy-foreground text-brand-navy hover:bg-brand-navy-foreground hover:text-brand-navy dark:hover:bg-brand-navy-foreground"
                  : "bg-card text-foreground shadow-sm hover:bg-card dark:hover:bg-card"
                : tone === "dark"
                  ? "text-brand-navy-foreground/60 hover:text-brand-navy-foreground"
                  : "text-muted-foreground hover:text-foreground"
            )}
          >
            {l}
          </Button>
        );
      })}
    </div>
  );
}
