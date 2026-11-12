import { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { dismissToast, toast, type ToastTone } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Toaster } from "./toast";

/* The toasts live in a module-level store, so a story fires them from an effect
   and clears them on the way out. A long duration keeps them on screen. */
function ToastsOnMount({ tones, withAction }: { tones: ToastTone[]; withAction?: boolean }) {
  useEffect(() => {
    const ids = tones.map((tone) =>
      toast({
        tone,
        title: `${tone[0].toUpperCase()}${tone.slice(1)} toast`,
        description: "Catalogue published · shared with 6 suppliers",
        duration: 600000,
        action: withAction ? { label: "Undo", onClick: fn() } : undefined,
      })
    );
    return () => ids.forEach(dismissToast);
  }, [tones, withAction]);
  return <Toaster />;
}

const meta = {
  title: "Custom/Toast",
  component: Toaster,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every tone, stacked bottom-right. */
export const Tones: Story = {
  render: () => <ToastsOnMount tones={["default", "success", "warning", "critical"]} />,
};

/** With an Undo action, as after a status change. */
export const WithAction: Story = {
  render: () => <ToastsOnMount tones={["success"]} withAction />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Undo" })).toBeVisible();
  },
};

/** Fired by a click, the way a screen does it; dismissable by hand. */
export const FromClick: Story = {
  render: () => (
    <div className="p-6">
      <Button onClick={() => toast({ tone: "success", title: "Saved", description: "Changes are live." })}>
        Save
      </Button>
      <Toaster />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(await canvas.findByRole("status")).toHaveTextContent("Saved");
  },
};
