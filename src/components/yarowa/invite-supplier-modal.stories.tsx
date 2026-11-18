import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen } from "storybook/test";
import { InviteSupplierModal } from "./invite-supplier-modal";

/* The dialog renders in a portal, so the plays query `screen`, not `canvas`.
   Company names come from COMPANY_DIRECTORY in src/data.ts, which decides the
   match state (new / already on Lynk / already connected). */

const meta = {
  title: "Custom/Invite Supplier Modal",
  component: InviteSupplierModal,
  tags: ["ai-generated"],
  args: { open: true, onClose: fn(), onCreateProspect: fn() },
} satisfies Meta<typeof InviteSupplierModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A company not on Lynk: contact, details, settings and review steps. */
export const NewSupplier: Story = {
  play: async ({ userEvent }) => {
    await userEvent.type(await screen.findByPlaceholderText(/search or enter company name/i), "Neubau Fenster GmbH");
    await expect(screen.getByPlaceholderText(/full name/i)).toBeVisible();
  },
};

/** A company already on Lynk: a connection request instead of an email invite. */
export const AlreadyOnLynk: Story = {
  play: async ({ userEvent }) => {
    await userEvent.type(await screen.findByPlaceholderText(/search or enter company name/i), "Arctis Build Systems");
    await expect(await screen.findByText(/is already on Lynk/i)).toBeVisible();
  },
};

/** Already in the network: the flow ends with Close. */
export const AlreadyConnected: Story = {
  play: async ({ userEvent }) => {
    await userEvent.type(await screen.findByPlaceholderText(/search or enter company name/i), "DeltaHaus Roofing GmbH");
    await expect(await screen.findByText(/is already connected/i)).toBeVisible();
  },
};
