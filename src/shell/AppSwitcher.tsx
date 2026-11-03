import { useState } from "react";
import { ChevronDown, ExternalLink, LayoutGrid } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { APP_GROUPS, type PlatformApp } from "./apps";

/*
 * Global app switcher — the one place the shell lets a user move between
 * micro frontends. Top right, as in the platform today.
 *
 * It only ever lists the apps the signed-in role may open: the shell filters
 * the manifest, so an app you are not entitled to is not hidden behind a
 * disabled row, it simply is not there. Searchable, because the list is
 * expected to grow from 9 to 15+ (Thomas, 28 Oct).
 *
 * Triggers take buttonVariants instead of `asChild` + <Button>: the registry's
 * Button is written for React 19 (ref as a prop), and on this React 18 project
 * Radix would lose the anchor ref and place the popover off-screen.
 */
export function AppSwitcher({
  apps,
  activeId,
  onSelect,
}: {
  apps: PlatformApp[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const active = apps.find((a) => a.id === activeId);
  const ActiveIcon = active?.icon ?? LayoutGrid;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")} aria-label={t("Switch app")}>
          <LayoutGrid />
          <span className="hidden sm:inline text-muted-foreground">{t("Apps")}</span>
          <span className="hidden sm:inline h-4 w-px bg-border" aria-hidden />
          <ActiveIcon className="text-primary" />
          <span className="max-w-40 truncate">{active ? t(active.name) : t("Choose an app")}</span>
          <ChevronDown className="text-muted-foreground" />
        </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <Command>
          <CommandInput placeholder={t("Search apps…")} />
          <CommandList className="max-h-[420px]">
            <CommandEmpty>{t("No app found.")}</CommandEmpty>
            {APP_GROUPS.map((group, i) => {
              const inGroup = apps.filter((a) => a.group === group);
              if (!inGroup.length) return null;
              return (
                <div key={group}>
                  {i > 0 ? <CommandSeparator /> : null}
                  <CommandGroup heading={t(group)}>
                    {inGroup.map((app) => {
                      const Icon = app.icon;
                      const isActive = app.id === activeId;
                      return (
                        <CommandItem
                          key={app.id}
                          value={`${app.name} ${t(app.name)} ${app.description}`}
                          data-checked={isActive}
                          onSelect={() => {
                            onSelect(app.id);
                            setOpen(false);
                          }}
                          className="items-start py-2"
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border",
                              isActive ? "border-primary/30 bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="flex items-center gap-1.5 font-medium">
                              {t(app.name)}
                              {app.external ? <ExternalLink className="size-3 text-muted-foreground" /> : null}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">{t(app.description)}</span>
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </div>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
