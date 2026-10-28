import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Button" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** All variants, including the Lynk-added solid `danger` and `success`. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["default", "outline", "secondary", "ghost", "destructive", "danger", "success", "link"] as const).map(
        (v) => (
          <Button key={v} variant={v}>
            {v}
          </Button>
        )
      )}
    </div>
  ),
};

/**
 * The green `secondary` variant in every state, light and dark (use the Theme
 * toolbar). Hover, active and focus are pinned with the same utility classes
 * the variant applies on interaction, so they can be compared side by side —
 * hover/tab the first button to see the real behaviour.
 *
 * Tokens: `--secondary-brand-*` in `src/styles/tokens.css`.
 * Text contrast — light 8.9 / 8.2 / 7.5:1, dark 9.7 / 8.3 / 7.1:1 (AAA throughout).
 */
export const SecondaryStates: Story = {
  render: () => {
    const states = [
      { label: "Default (interactive)", className: "" },
      { label: "Hover", className: "border-secondary-brand-border-hover bg-secondary-brand-hover" },
      { label: "Active / pressed", className: "border-secondary-brand-border-hover bg-secondary-brand-active" },
      {
        label: "Focus-visible",
        className:
          "ring-2 ring-secondary-brand-ring ring-offset-2 ring-offset-background",
      },
      { label: "Disabled", className: "", disabled: true },
    ];
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end gap-6">
          {states.map((s) => (
            <div key={s.label} className="flex flex-col items-start gap-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <Button variant="secondary" className={s.className} disabled={s.disabled}>
                Secondary
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["xs", "sm", "default", "lg"] as const).map((size) => (
            <Button key={size} variant="secondary" size={size}>
              Size {size}
            </Button>
          ))}
        </div>
      </div>
    );
  },
};

/** Secondary next to primary and outline — the usual action pairing. */
export const SecondaryWithPrimary: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button>Save changes</Button>
      <Button variant="secondary">Save draft</Button>
      <Button variant="outline">Cancel</Button>
    </div>
  ),
};

/**
 * Primary (`default`) in every state. Hover and press darken the green
 * (`--primary-hover` / `--primary-active` in tokens.css) instead of fading it.
 * White label: 5.9:1 default, 7.0:1 hover, 8.1:1 active. Hover/active/focus
 * are pinned with the same utilities the variant uses, for side-by-side review.
 */
export const PrimaryStates: Story = {
  render: () => {
    const states = [
      { label: "Default (interactive)", className: "" },
      { label: "Hover", className: "bg-primary-hover" },
      { label: "Active / pressed", className: "bg-primary-active" },
      { label: "Focus-visible", className: "border-ring ring-3 ring-ring/30" },
      { label: "Disabled", className: "", disabled: true },
    ];
    return (
      <div className="flex flex-wrap items-end gap-6">
        {states.map((s) => (
          <div key={s.label} className="flex flex-col items-start gap-2">
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <Button className={s.className} disabled={s.disabled}>
              Primary
            </Button>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * Corner radius — 4px, from `rounded-[4px]` on the component's base class in
 * `button.tsx` rather than from the `--radius` scale. The same corner holds at
 * every size and on the square icon buttons, where it is most visible.
 */
export const CornerRadius: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {(["xs", "sm", "default", "lg"] as const).map((size) => (
          <Button key={size} size={size}>
            Size {size}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(["icon-xs", "icon-sm", "icon", "icon-lg"] as const).map((size) => (
          <Button key={size} size={size} variant="outline" aria-label={`Add (${size})`}>
            <Plus />
          </Button>
        ))}
      </div>
    </div>
  ),
};
