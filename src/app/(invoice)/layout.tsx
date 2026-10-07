import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

/**
 * The frame around an invoice.
 *
 * Same trick as `(checkout)`, with the roles reversed: an invoice is a document,
 * not a desk — none of the admin chrome renders here, so printing produces one
 * clean page. What remains is a slim utility bar that is hidden when printed:
 * a way back to the order, and the print button itself.
 */
export default function InvoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-warm-white">
      {children}
    </div>
  );
}
