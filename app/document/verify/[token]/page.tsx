import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { z } from "zod";
import { intakeDatabase } from "@/lib/supabase/server";
import { clientAddress } from "@/lib/enquiry-challenge";
import PageShell from "@/components/page-shell";
export const metadata = {
  title: "Official document verification",
  robots: { index: false, follow: false },
};
export default async function Verify({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!z.uuid().safeParse(token).success) notFound();
  if (!process.env.RATE_LIMIT_SALT)
    throw Error("Verification is temporarily unavailable.");
  const rate = createHash("sha256")
    .update(`${process.env.RATE_LIMIT_SALT}:${clientAddress(await headers())}`)
    .digest("hex");
  const { data, error } = await intakeDatabase().rpc("msbd_verification", {
    p_token: token,
    p_rate: rate,
  });
  if (error)
    throw Error(
      "Verification is temporarily unavailable. Please contact Mega Stride.",
    );
  return (
    <PageShell
      eyebrow="Mega Stride · Document authenticity"
      title={
        data?.limited
          ? "Please try again shortly."
          : data
            ? data.valid
              ? "Official document found."
              : "Review this document’s status."
            : "Document could not be verified."
      }
      intro="Verification confirms this company record and its current status. It does not disclose private client or payment information."
    >
      <section className="platform-panel max-w-2xl">
        {data && !data.limited ? (
          <dl className="grid gap-5 sm:grid-cols-2">
            {Object.entries({
              Company: data.company,
              Type: String(data.kind).replaceAll("_", " "),
              Reference: data.number,
              Status: String(data.status).replaceAll("_", " "),
              Issued: new Date(data.issued_at).toLocaleDateString("en-GB"),
              Client: data.client,
            }).map(([k, v]) => (
              <div key={k}>
                <dt className="section-kicker">{k}</dt>
                <dd className="mt-3 font-bold">{String(v)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>
            {data?.limited
              ? "Too many verification requests. Wait a minute and try again."
              : "This verification code does not match an issued record. Check the QR code or contact the company before relying on this document."}
          </p>
        )}
        <a className="text-link mt-7" href="/contact">
          Contact Mega Stride →
        </a>
      </section>
    </PageShell>
  );
}
