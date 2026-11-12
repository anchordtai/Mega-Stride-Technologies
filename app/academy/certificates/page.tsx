import { redirect } from "next/navigation";
import PageShell from "@/components/page-shell";
export const metadata = {
  title: "Verify an Academy certificate",
  robots: { index: false, follow: false },
};
export default async function Verify({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  if (code && /^[a-f0-9]{32}$/i.test(code.trim()))
    redirect(`/academy/certificates/${code.trim().toLowerCase()}`);
  return (
    <PageShell
      eyebrow="Certificate verification"
      title="Verify a learning achievement."
      intro="Enter the certificate ID or scan the QR code printed on the certificate."
    >
      <form className="platform-panel max-w-2xl">
        <label className="form-label">
          Certificate ID
          <input
            className="form-input"
            name="code"
            minLength={32}
            maxLength={32}
            pattern="[a-fA-F0-9]{32}"
            required
            autoComplete="off"
          />
        </label>
        <button className="primary-button mt-5">Verify certificate</button>
        {code && (
          <p role="status" className="mt-5">
            Enter the complete 32-character certificate ID.
          </p>
        )}
      </form>
    </PageShell>
  );
}
