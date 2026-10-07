import { headers } from "next/headers";

/*
  The absolute origin of this deployment, for URLs an external service has to
  call back into — the Stripe success and cancel pages.

  `APP_URL` wins when it is set (it is the deployment's honest address). Without
  it the request headers are read: `x-forwarded-host` when the app sits behind a
  proxy, otherwise `Host`, and the scheme follows the forwarded proto or a
  localhost guess on the hostname.
*/

export async function getOrigin(): Promise<string> {
  const configured = process.env.APP_URL?.trim();

  if (configured) return configured.replace(/\/+$/, "");

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const proto =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");

  return `${proto}://${host}`;
}