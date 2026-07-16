import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PortalCompanyDetailsProps {
  supplierId: string;
}

export function PortalCompanyDetails({ supplierId }: PortalCompanyDetailsProps) {
  // Mock company data
  const companyData = {
    companyName: "EuroBau Components GmbH",
    trade: "Building Materials & Components",
    region: "Central Europe",
    vatId: "DE123456789",
    address: "Industriestrasse 42, 10115 Berlin",
    city: "Berlin",
    postalCode: "10115",
    country: "Germany",
    iban: "DE89370400440532013000",
    bic: "COBADEHHXXX",
    primaryContact: {
      name: "Martin Weber",
      role: "Managing Director",
      email: "martin@eurobau.de",
      phone: "+49-30-123456",
    },
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Details</h1>
        <p className="text-muted-foreground mt-1">Your shared company information across all principals</p>
      </div>

      {/* Company Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Company Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Company Name</Label>
            <p className="mt-1 p-2 bg-muted rounded text-sm">{companyData.companyName}</p>
          </div>
          <div>
            <Label>Trade / Industry</Label>
            <p className="mt-1 p-2 bg-muted rounded text-sm">{companyData.trade}</p>
          </div>
          <div>
            <Label>VAT ID</Label>
            <p className="mt-1 p-2 bg-muted rounded text-sm">{companyData.vatId}</p>
          </div>
          <div>
            <Label>Region</Label>
            <p className="mt-1 p-2 bg-muted rounded text-sm">{companyData.region}</p>
          </div>
          <div className="md:col-span-2">
            <Label>Address</Label>
            <p className="mt-1 p-2 bg-muted rounded text-sm">{companyData.address}</p>
          </div>
        </div>
      </Card>

      {/* Banking Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Banking Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>IBAN</Label>
            <p className="mt-1 p-2 bg-muted rounded text-sm font-mono">{companyData.iban}</p>
          </div>
          <div>
            <Label>BIC</Label>
            <p className="mt-1 p-2 bg-muted rounded text-sm font-mono">{companyData.bic}</p>
          </div>
        </div>
      </Card>

      {/* Primary Contact */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Primary Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <p className="mt-1 p-2 bg-muted rounded text-sm">{companyData.primaryContact.name}</p>
          </div>
          <div>
            <Label>Role</Label>
            <p className="mt-1 p-2 bg-muted rounded text-sm">{companyData.primaryContact.role}</p>
          </div>
          <div>
            <Label>Email</Label>
            <p className="mt-1 p-2 bg-muted rounded text-sm">{companyData.primaryContact.email}</p>
          </div>
          <div>
            <Label>Phone</Label>
            <p className="mt-1 p-2 bg-muted rounded text-sm">{companyData.primaryContact.phone}</p>
          </div>
        </div>
      </Card>

      <button className="px-4 py-2 border border-border rounded font-medium hover:bg-accent">
        Request Edit Mode
      </button>
    </div>
  );
}
