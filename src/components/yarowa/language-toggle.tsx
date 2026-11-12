/**
 * @custom   EN | DE language switch: a ToggleGroup bound to useI18n, restyled as
 *           a compact pill in light and brand-navy tones. ToggleGroup has no pill
 *           or dark variant, and the i18n binding is shared by three screens.
 *           Composes ToggleGroup and Text.
 * @approved Yuliya Babkina, 2026-11-12
 */

import { useI18n } from "@/lib/i18n-context";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Text } from "@/shared/ui/typography";

/*
 * Compact EN | DE segmented toggle for the header. One click flips language,
 * the active one stays highlighted. `tone="dark"` adapts it to the brand-navy
 * header; `tone="light"` for light surfaces.
 */
const LANGS: Lang[] = ["en", "de"];

export function LanguageToggle({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { lang, setLang, t } = useI18n();
  const dark = tone === "dark";
  return (
    <ToggleGroup
      type="single"
      value={lang}
      // Radix reports "" when the active item is pressed again; a language is
      // always selected, so that is ignored.
      onValueChange={(next) => {
        if (next) setLang(next as Lang);
      }}
      spacing={0.5}
      aria-label={t("Language")}
      className={cn("rounded-full p-0.5", dark ? "bg-brand-navy-foreground/10" : "bg-secondary")}
    >
      {LANGS.map((l) => (
        <ToggleGroupItem
          key={l}
          value={l}
          aria-label={l}
          className={cn(
            "h-auto min-w-0 rounded-full px-2 py-0.5 hover:bg-transparent aria-checked:bg-transparent dark:hover:bg-transparent",
            dark
              ? "text-brand-navy-foreground/60 hover:text-brand-navy-foreground data-[state=on]:bg-brand-navy-foreground data-[state=on]:text-brand-navy data-[state=on]:hover:bg-brand-navy-foreground data-[state=on]:hover:text-brand-navy"
              : "text-muted-foreground hover:text-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=on]:hover:bg-card"
          )}
        >
          <Text variant="eyebrow" as="span" className="text-inherit">
            {l}
          </Text>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
