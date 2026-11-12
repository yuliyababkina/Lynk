import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Text } from "@/shared/ui/typography";
import { PdfCanvas } from "./pdf-canvas";
import sampleUrl from "../../../supabase/mock-documents/yilmaz/Public_Liability_Insurance.pdf?url";

const meta = {
  title: "Custom/Pdf Canvas",
  component: PdfCanvas,
  tags: ["ai-generated"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="flex h-[480px] w-[720px] flex-col rounded-lg border border-border">
        <Story />
      </div>
    ),
  ],
  args: { fileUrl: sampleUrl, className: "flex-1 min-h-0" },
} satisfies Meta<typeof PdfCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Rendered with pdf.js onto canvases at true 100%, so it works without a native PDF plugin. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(await findCanvas(canvasElement)).toBeTruthy();
  },
};

async function findCanvas(root: HTMLElement) {
  for (let i = 0; i < 50; i++) {
    const c = root.querySelector("canvas");
    if (c) return c;
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

function WithPageInfo() {
  const [info, setInfo] = useState<{ current: number; total: number } | null>(null);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Text variant="small" className="border-b border-border px-3 py-2">
        {info ? `Page ${info.current} of ${info.total}` : "Loading…"}
      </Text>
      <PdfCanvas fileUrl={sampleUrl} className="flex-1 min-h-0" onPageInfo={setInfo} />
    </div>
  );
}

/** It reports the page in view, so the surrounding chrome can show "1 of N". */
export const WithPageCount: Story = { render: () => <WithPageInfo /> };

/** No file attached: a note instead of a viewer. */
export const NoFile: Story = { args: { fileUrl: undefined } };
