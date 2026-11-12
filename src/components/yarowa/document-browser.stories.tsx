import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { I18nProvider } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { DocumentBrowser, type DocumentBrowserRow } from "./document-browser";

const ROWS: DocumentBrowserRow[] = [
  { key: "pli", name: "Public Liability Insurance", status: "valid" },
  { key: "tax", name: "Tax Clearance Certificate", status: "warning-30", statusNote: "Expires in 21 days" },
  { key: "iso", name: "ISO 9001 Certificate", status: "pending-review" },
  { key: "ins", name: "Employer's Liability Insurance", status: "rejected-resubmit" },
  { key: "bank", name: "Bank Details Confirmation" },
];

const meta = {
  title: "Custom/Document Browser",
  component: DocumentBrowser,
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <I18nProvider>
        <Story />
      </I18nProvider>
    ),
  ],
  args: { rows: ROWS, selectedKey: "pli", onSelect: fn(), height: "h-[420px]" },
} satisfies Meta<typeof DocumentBrowser>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A document that was expected but never uploaded has no status and no file. */
export const MissingDocument: Story = { args: { selectedKey: "bank" } };

export const Empty: Story = { args: { rows: [], selectedKey: null } };

/* Named component, not an inline render function: it holds the selection. */
function InteractiveBrowser() {
  const [key, setKey] = useState<string | null>("tax");
  return (
    <DocumentBrowser
      rows={ROWS}
      selectedKey={key}
      onSelect={setKey}
      height="h-[420px]"
      renderActions={() => (
        <>
          <Button variant="outline">Decline</Button>
          <Button>Approve</Button>
        </>
      )}
    />
  );
}

/** Role-specific actions are injected through the renderActions slot. */
export const WithRoleActions: Story = { render: () => <InteractiveBrowser /> };
