import type { ReactNode } from "react";

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
  return (
    <header className="h-12 flex items-center px-6 shrink-0 bg-brand-navy text-white">
      {leading ? <div className="mr-3">{leading}</div> : null}
      <span className="text-sm font-medium text-white/70">
        Lynk / Procurement Platform / <span className="text-white/95">{currentLabel}</span>
      </span>
      <div className="flex-1" />
      {onSwitchAccount ? (
        <>
          <button
            onClick={onSwitchAccount}
            className="mr-3 text-xs font-medium text-white/70 hover:text-white transition-colors"
            title="Switch account"
          >
            Switch
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
