import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { FileUploadCard } from "./file-upload-card";

const meta = {
  title: "Product Components/File Upload Card",
  component: FileUploadCard,
  tags: ["autodocs"],
  args: { onUpload: fn() },
  parameters: { layout: "padded" },
  decorators: [(Story) => <div style={{ maxWidth: 512, margin: "0 auto" }}><Story /></div>],
} satisfies Meta<typeof FileUploadCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Initial dropzone for the create flow. */
export const Default: Story = {};

/** Loading: the file is being parsed (transient state after upload). */
export const Parsing: Story = {
  args: { loading: true, loadingLabel: "Parsing file…", loadingFilename: "services_painting.xlsx" },
};

/** Update flow — comparing the new file against the current version. */
export const UpdateComparing: Story = {
  args: {
    loading: true,
    loadingLabel: "Comparing with current version…",
    loadingFilename: "services_painting_2027.xlsx",
  },
};

/** Update flow dropzone (different copy + button label). */
export const UpdateMode: Story = {
  args: {
    description:
      "Upload the updated price list. It will be compared against the current active version.",
    buttonLabel: "Upload updated file",
  },
};
