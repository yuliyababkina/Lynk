import { ReceiptText } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface PortalPriceAgreementsProps {
  supplierId: string;
}

export function PortalPriceAgreements({ supplierId: _supplierId }: PortalPriceAgreementsProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Price Agreements</h1>
        <p className="text-muted-foreground mt-1">Rate cards and framework pricing agreed with your principals.</p>
      </div>

      <Card className="rounded-2xl border border-dashed border-border ring-0 shadow-none [--card-spacing:0px] p-12 items-center text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <ReceiptText className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="font-medium">No price agreements yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          When a principal shares a rate card or framework agreement with you, it will appear here for review.
        </p>
      </Card>
    </div>
  );
}
