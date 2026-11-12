import type { Meta, StoryObj } from "@storybook/react-vite";
import { MockDocumentPage } from "./mock-document-page";

const meta = {
  title: "Custom/Mock Document Page",
  component: MockDocumentPage,
  tags: ["ai-generated"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-secondary/40 p-6">
        <Story />
      </div>
    ),
  ],
  args: {
    documentName: "Public Liability Insurance",
    category: "Insurance",
    documentType: "Insurance policy",
    issuingInstitution: "Allianz Versicherungs-AG",
    expiry: "30 Sep 2027",
  },
} satisfies Meta<typeof MockDocumentPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A seeded document with full metadata. */
export const Default: Story = {};

/** Metadata missing: the page falls back to generic labels and dashes. */
export const SparseMetadata: Story = {
  args: { category: undefined, documentType: undefined, issuingInstitution: undefined, expiry: undefined },
};
