import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/yarowa/language-toggle";

export interface TopHeaderProps {
  currentLabel: string;
  onSwitchAccount?: () => void;
  accountInitials?: string;
  leading?: ReactNode;
}

export function TopHeader({
  currentLabel,
  onSwitchAccount,
  accountInitials = "SM",
  leading,
}: TopHeaderProps) {
  const { t } = useI18n();
  return (
    <header className="h-12 flex items-center px-6 shrink-0 bg-brand-navy text-brand-navy-foreground">
      {leading ? <div className="mr-3">{leading}</div> : null}
      {/* Just the current page — the brand and platform name already sit in the
          sidebar header, so repeating them here only ate horizontal space. */}
      <span className="text-sm font-medium text-brand-navy-foreground/95">{t(currentLabel)}</span>
      <div className="flex-1" />
      <LanguageToggle tone="dark" />
      {onSwitchAccount ? (
        <>
          <button
            onClick={onSwitchAccount}
            className="mx-3 text-xs font-medium text-brand-navy-foreground/70 hover:text-brand-navy-foreground transition-colors"
            title="Switch account"
          >
            {t("Switch")}
          </button>
          <button
            onClick={onSwitchAccount}
            className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center cursor-pointer hover:opacity-80"
            title="Switch account"
          >
            {accountInitials}
          </button>
        </>
      ) : null}
    </header>
  );
}
