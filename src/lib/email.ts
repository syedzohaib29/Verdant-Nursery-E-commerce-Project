import "server-only";

import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/constants";
import { formatDate, formatPrice } from "@/lib/utils";

/*
  Order confirmations.

  One template, two transports: in development the receipt is a log line (the
  promise "logged to the console in dev" is a real transport, not a placeholder),
  and when `RESEND_API_KEY` is set the same message is sent through Resend's HTTP
  API. Every `sendOrderEmail` call is wrapped in try/catch on purpose — an email
  that fails must never fail the order it is announcing.
*/

export type OrderEmailData = {
  orderNumber: string;
  email: string;
  customerName: string | null;
  paymentMethodLabel: string;
  totalLabel: string;
  shippingLabel: string;
  /** The shipping address as one block, for the label. */
  shippingAddress: string;
  placedAtLabel: string;
  itemCount: number;
  lines: {
    name: string;
    quantity: number;
    priceLabel: string;
  }[];
};

const INK = "#0B0F0C";
const FOREST = "#14532D";
const MINT = "#E6F2E8";
const WARM_WHITE = "#F8F8F4";
const WHITE = "#FFFFFF";

/**
 * The raw shape a caller already has after creating or confirming an order.
 * Both the checkout action and the Stripe webhook build the same email from
 * their own view of the order, which is why the description is a row, not the
 * template's finished words.
 */
export type OrderEmailRow = {
  orderNumber: string;
  email: string;
  customerName: string | null;
  paymentMethod: PaymentMethod;
  totalCents: number;
  /** Zero when the order crossed the free-shipping line. */
  shippingCents: number;
  itemCount: number;
  createdAt: Date;
  /** The shipping address as one block, for the label. */
  shippingAddress: string;
  items: { name: string; quantity: number; priceCents: number }[];
};

export function buildOrderEmailData(row: OrderEmailRow): OrderEmailData {
  return {
    orderNumber: row.orderNumber,
    email: row.email,
    customerName: row.customerName,
    paymentMethodLabel: PAYMENT_METHOD_LABELS[row.paymentMethod],
    totalLabel: formatPrice(row.totalCents),
    shippingLabel:
      row.shippingCents === 0 ? "Free" : formatPrice(row.shippingCents),
    shippingAddress: row.shippingAddress,
    placedAtLabel: formatDate(row.createdAt, true),
    itemCount: row.itemCount,
    lines: row.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      priceLabel: formatPrice(item.priceCents),
    })),
  };
}

/** Inline styles only: the mail clients that read this ignore stylesheets. */
export function buildOrderEmailHtml(data: OrderEmailData): string {
  const rows = data.lines
    .map((line) => {
      const amount = line.priceLabel;
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #dfe6e0;color:${INK};">
            <span style="font-weight:600;">${line.name}</span>
            <span style="color:#6b7269;">&nbsp;&nbsp;×&nbsp;${line.quantity}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #dfe6e0;text-align:right;color:${INK};white-space:nowrap;">${amount}</td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:${WARM_WHITE};font-family:Inter,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:${WHITE};border:1px solid #e3e8e2;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:${FOREST};padding:24px 32px;">
              <p style="margin:0;color:${WHITE};font-size:20px;font-weight:700;letter-spacing:-0.02em;">Verdant</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;color:${FOREST};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">
                Order confirmed
              </p>
              <h1 style="margin:0 0 12px;color:${INK};font-size:26px;line-height:1.15;letter-spacing:-0.02em;">
                ${data.customerName ? `Thank you, ${data.customerName.split(" ")[0]}.` : "Thank you."} Your plants are spoken for.
              </h1>
              <p style="margin:0;color:#4c554d;font-size:15px;line-height:1.6;">
                Order <strong style="color:${INK};">${data.orderNumber}</strong> · placed ${data.placedAtLabel} ·
                ${data.paymentMethodLabel}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e3e8e2;">
                ${rows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;color:#4c554d;font-size:14px;">Subtotal</td>
                  <td style="padding:4px 0;text-align:right;color:${INK};font-size:14px;">${data.totalLabel}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;border-top:1px solid #e3e8e2;color:${INK};font-size:16px;font-weight:700;">Total</td>
                  <td style="padding:4px 0;border-top:1px solid #e3e8e2;text-align:right;color:${FOREST};font-size:18px;font-weight:700;">${data.totalLabel}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:${MINT};padding:24px 32px;">
              <p style="margin:0 0 6px;color:${INK};font-size:14px;font-weight:600;">What happens next</p>
              <p style="margin:0;color:#39433b;font-size:14px;line-height:1.6;">
                We pot and pack your ${data.itemCount === 1 ? "plant" : "plants"} within a day or two,
                then the driver brings them to:<br />
                <span style="white-space:pre-line;color:${INK};">${data.shippingAddress}</span>
              </p>
              <p style="margin:14px 0 0;color:#39433b;font-size:14px;line-height:1.6;">
                Shipping is ${data.shippingLabel}. Reply to this email if anything looks wrong —
                a real person reads it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends the order receipt. Never throws.
 *
 * Returns false when the mail could not be sent so a caller *could* log it, but
 * the contract is that a failed email changes nothing about the order.
 */
export async function sendOrderEmail(data: OrderEmailData): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      // Development transport: the receipt is a log line on this machine. The
      // subject and recipient are included so a dev server doubles as an inbox.
      console.log(
        `[verdant email] to ${data.email} — order ${data.orderNumber} confirmed (${data.totalLabel})`,
      );
      return true;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Verdant <onboarding@resend.dev>",
        to: [data.email],
        subject: `Your Verdant order ${data.orderNumber} is in`,
        html: buildOrderEmailHtml(data),
      }),
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}