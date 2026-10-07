"use client";

import { PrinterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** The print dialog's button, in the one slim toolbar the invoice page has. */
export function PrintButton() {
  return (
    <Button
      type="button"
      size="sm"
      onClick={() => window.print()}
      className="print:hidden"
    >
      <PrinterIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
      Print
    </Button>
  );
}
