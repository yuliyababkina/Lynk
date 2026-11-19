/**
 * @custom   Avatar trigger, unassigned state and team-grouped search list, reused in the task row and the ticket drawer; Popover + Command alone don't carry this.
 * @approved Yuliya Babkina, 2026-11-19
 */
import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { ChevronDown, UserCheck, UserPlus, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n-context";
import { avatarToneClass } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

/*
 * Who owns a task — one person or nobody, never a team. Team only groups the
 * people in the list (the current user's team first).
 *
 * `avatar` is the compact trigger at the end of a task row; `field` is the
 * avatar + name + team value in the ticket drawer. Both open the same list.
 *
 * Triggers take buttonVariants rather than `asChild` + <Button>: Button is not a
 * forwardRef component on React 18, so Popover could not position against it.
 * The tooltip hangs off a wrapping span for the same reason.
 */

/** Keeps clicks and keys (including from the portalled list, which bubbles
 * through the React tree) away from a clickable row the picker sits in. */
const stop = (e: MouseEvent | KeyboardEvent) => e.stopPropagation();

/*
 * Sizes come in matched pairs so the avatar always stands exactly as tall as
 * the row's action buttons: default Button (h-8) ↔ Button size "icon" (size-8)
 * ↔ Avatar size "default" (size-8). Change one, change its partner — never a
 * pixel value. The smaller "sm" avatar is only for the list inside the picker.
 */
const TRIGGER_SIZE = "icon" as const;

/*
 * Initials on the person's own colour by default. A photo, when the user has
 * one, sits on top; if it fails to load, Radix falls back to the initials.
 * alt is empty: the name is always given next to it or in the trigger's label.
 */
function PersonAvatar({ user, size = "default" }: { user: User | null; size?: "default" | "sm" }) {
  if (!user) {
    return (
      <Avatar size={size} className="border border-dashed border-muted-foreground/60 after:hidden">
        <AvatarFallback className="bg-transparent text-muted-foreground">
          <UserPlus className={size === "sm" ? "size-3" : "size-4"} aria-hidden="true" />
        </AvatarFallback>
      </Avatar>
    );
  }
  return (
    <Avatar size={size}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
      <AvatarFallback className={cn("font-medium", avatarToneClass(user.id))}>
        {user.avatarInitials}
      </AvatarFallback>
    </Avatar>
  );
}

export function AssigneePicker({
  assignee,
  currentUser,
  users,
  onChange,
  readOnly = false,
  variant = "avatar",
  align = "end",
}: {
  /** The current assignee, or null when the task is unassigned. */
  assignee: User | null;
  /** The person using the app — drives "Assign to me" and the team order. */
  currentUser: User;
  /** Everyone a task can be assigned to. */
  users: User[];
  /** Called with the chosen person's id, or null for "Unassigned". */
  onChange?: (userId: string | null) => void;
  /** Shows the assignee without the picker (e.g. resolved tasks). */
  readOnly?: boolean;
  variant?: "avatar" | "field";
  align?: "start" | "center" | "end";
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const isMine = assignee?.id === currentUser.id;
  const name = assignee?.name ?? t("Unassigned");
  const tooltip = assignee
    ? t("Assigned to {name} · {team}", { name: assignee.name, team: t(assignee.team) })
    : t("Unassigned");

  // My team first, then the rest alphabetically; people alphabetically within.
  const teams = [...new Set(users.map((u) => u.team))].sort((a, b) =>
    a === currentUser.team ? -1 : b === currentUser.team ? 1 : a.localeCompare(b)
  );
  const membersOf = (team: string) =>
    users.filter((u) => u.team === team).sort((a, b) => a.name.localeCompare(b.name));

  const pick = (userId: string | null) => {
    setOpen(false);
    if (userId !== (assignee?.id ?? null)) onChange?.(userId);
  };

  const fieldValue = (
    <>
      <PersonAvatar user={assignee} />
      <span className="min-w-0 text-left">
        <span className={cn("block truncate text-sm", !assignee && "text-muted-foreground")}>{name}</span>
        {assignee && <span className="block truncate text-xs text-muted-foreground">{t(assignee.team)}</span>}
      </span>
    </>
  );

  if (readOnly) {
    return variant === "field" ? (
      <div className="flex min-w-0 items-center gap-2">{fieldValue}</div>
    ) : (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span role="img" tabIndex={0} aria-label={tooltip} className="inline-flex rounded-full">
              <PersonAvatar user={assignee} />
            </span>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const trigger = (
    <PopoverTrigger
      aria-label={t("Change assignee, currently {name}", { name })}
      className={cn(
        variant === "avatar"
          ? cn(buttonVariants({ variant: "ghost", size: TRIGGER_SIZE }), "rounded-full border-0 p-0")
          : cn(
              buttonVariants({ variant: "ghost" }),
              "h-auto max-w-full justify-start gap-2 border-0 px-1.5 py-1 font-normal"
            )
      )}
    >
      {variant === "avatar" ? (
        <PersonAvatar user={assignee} />
      ) : (
        <>
          {fieldValue}
          <ChevronDown size={14} className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </>
      )}
    </PopoverTrigger>
  );

  return (
    <div className="inline-flex min-w-0" onClick={stop} onKeyDown={stop}>
      <Popover open={open} onOpenChange={setOpen}>
        {variant === "avatar" ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">{trigger}</span>
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          trigger
        )}
        <PopoverContent align={align} className="w-72 p-0">
          <Command>
            <CommandInput placeholder={t("Search people…")} aria-label={t("Search people…")} />
            <CommandList>
              <CommandEmpty>{t("No one found.")}</CommandEmpty>
              <CommandGroup>
                {!isMine && (
                  <CommandItem
                    value="assign-to-me"
                    keywords={[t("Assign to me"), currentUser.name]}
                    onSelect={() => pick(currentUser.id)}
                  >
                    <UserCheck aria-hidden="true" />
                    {t("Assign to me")}
                  </CommandItem>
                )}
                <CommandItem
                  value="unassigned"
                  keywords={[t("Unassigned")]}
                  data-checked={!assignee}
                  onSelect={() => pick(null)}
                >
                  <UserX aria-hidden="true" />
                  {t("Unassigned")}
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              {teams.map((team) => (
                <CommandGroup key={team} heading={t(team)}>
                  {membersOf(team).map((u) => (
                    <CommandItem
                      key={u.id}
                      value={u.id}
                      keywords={[u.name, u.email]}
                      data-checked={u.id === assignee?.id}
                      onSelect={() => pick(u.id)}
                    >
                      <PersonAvatar user={u} size="sm" />
                      <span className="min-w-0 truncate">{u.name}</span>
                      {u.id === currentUser.id && (
                        <span className="shrink-0 text-xs text-muted-foreground">{t("(you)")}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
