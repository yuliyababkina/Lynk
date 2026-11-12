import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { MockDocumentPage } from "./mock-document-page";
import { FilePreviewLightbox } from "./file-preview-lightbox";
import sampleUrl from "../../../supabase/mock-documents/yilmaz/Public_Liability_Insurance.pdf?url";

const meta = {
  title: "Custom/File Preview Lightbox",
  component: FilePreviewLightbox,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  args: { fileName: "PLI-2027-renewal.pdf", fileSize: "184 KB", onClose: fn() },
} satisfies Meta<typeof FilePreviewLightbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A real file the supplier picked but has not submitted yet. */
export const WithFile: Story = { args: { fileUrl: sampleUrl } };

/** No file yet: a stand-in page is passed as children. */
export const WithStandInPage: Story = {
  args: {
    children: (
      <MockDocumentPage documentName="Public Liability Insurance" category="Insurance" expiry="30 Sep 2027" />
    ),
  },
};
