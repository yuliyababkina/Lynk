import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Supplier, SupplierDoc } from "@/types";
import { OnboardingApplicationBody } from "./onboarding-application-body";

const SUPPLIER = {
  id: "bauer",
  name: "Bauer Sanitär GmbH",
  stage: "prospect",
  woSystem: "Unknown",
  relationshipId: "bauer",
  trade: "Plumbing",
  region: "Bavaria",
  compliance: "—",
  rating: null,
  openTickets: 0,
  contacts: [{ name: "Klaus Bauer", role: "Owner", email: "klaus@bauer-sanitaer.de", phone: "+49 89 123456", primary: true }],
  regionsServed: [],
  capabilities: [],
  vatId: "DE123456789",
  address: "Lindwurmstraße 12, 80337 München",
  lastActive: "",
} as unknown as Supplier;

const doc = (id: string, documentName: string, status: SupplierDoc["status"], fileUrl?: string): SupplierDoc => ({
  id,
  supplierId: "bauer",
  supplierName: SUPPLIER.name,
  trade: "Plumbing",
  documentName,
  documentCategory: "Legal",
  expiryDate: "",
  daysUntilExpiry: 0,
  status,
  history: [],
  fileUrl,
});

const meta = {
  title: "Custom/Onboarding Application Body",
  component: OnboardingApplicationBody,
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <div className="w-[348px]">
        <Story />
      </div>
    ),
  ],
  args: {
    supplier: SUPPLIER,
    docs: [
      doc("d1", "Certificate of Incorporation", "valid", "https://example.com/coi.pdf"),
      doc("d2", "VAT Registration Certificate", "pending-review", "https://example.com/vat.pdf"),
      doc("d3", "Public Liability Insurance", "rejected-resubmit"),
    ],
  },
} satisfies Meta<typeof OnboardingApplicationBody>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Submitted application with documents in each review state. */
export const Submitted: Story = {};

/** Nothing uploaded yet. */
export const NoDocuments: Story = { args: { docs: [] } };
