import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n-context";
import { LanguageToggle } from "@/components/yarowa/language-toggle";
import { Button } from "@/components/ui/button";

export interface TopHeaderProps {
  currentLabel: string;
  onSwitchAccount?: () => void;
  accountInitials?: string;
  leading?: ReactNode;
  /** Sits left of the language toggle — the notification bell goes here. */
  trailing?: ReactNode;
  /** Off inside the platform shell, which owns the language switch. */
  showLanguage?: boolean;
}

export function TopHeader({
  currentLabel,
  onSwitchAccount,
  accountInitials = "SM",
  leading,
  trailing,
  showLanguage = true,
}: TopHeaderProps) {
  const { t } = useI18n();
  return (
    <header className="h-12 flex items-center px-6 shrink-0 bg-card text-foreground border-b border-border">
      {leading ? <div className="mr-3">{leading}</div> : null}
      {/* Just the current page — the brand and platform name already sit in the
          sidebar header, so repeating them here only ate horizontal space. */}
      <span className="text-sm font-medium">{t(currentLabel)}</span>
      <div className="flex-1" />
      {trailing ? <div className="mr-3">{trailing}</div> : null}
      {showLanguage ? <LanguageToggle /> : null}
      {onSwitchAccount ? (
        <>
          <Button
            variant="ghost"
            onClick={onSwitchAccount}
            className="mx-3 h-auto border-0 p-0 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
            title={t("Switch account")}
          >
            {t("Switch")}
          </Button>
          <Button
            variant="ghost"
            onClick={onSwitchAccount}
            className="size-7 cursor-pointer rounded-full border-0 bg-primary p-0 text-xs font-semibold text-primary-foreground hover:bg-primary hover:text-primary-foreground hover:opacity-80 dark:hover:bg-primary"
            title={t("Switch account")}
          >
            {accountInitials}
          </Button>
        </>
      ) : null}
    </header>
  );
}
