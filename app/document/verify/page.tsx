import PageShell from "@/components/page-shell";
export const metadata = {
  title: "Verify a Mega Stride document",
  robots: { index: false, follow: false },
};
export default function Verify() {
  return (
    <PageShell
      eyebrow="Document verification"
      title="Confidence in every official document."
      intro="Scan the document’s QR code or enter its verification code to check authenticity and current status."
    >
      <form action="/document/verify/check" className="platform-panel max-w-xl">
        <label className="form-label">
          Document verification code
          <input
            name="token"
            className="form-input"
            required
            pattern="[a-fA-F0-9-]{36}"
            maxLength={36}
          />
        </label>
        <button className="primary-button mt-5">Verify document</button>
        <p className="mt-5 text-sm leading-7">
          A sequential quotation or invoice number alone cannot reveal a
          client’s records. Obtain the unique verification code from the issued
          document.
        </p>
      </form>
      <a className="text-link mt-6" href="/client-portal">
        Open your secure client portal →
      </a>
    </PageShell>
  );
}
