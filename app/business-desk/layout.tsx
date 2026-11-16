import { requireBusiness } from "@/lib/business-desk/server";
import "./business-desk.css";
export const maxDuration = 60;
export const metadata = {
  title: "Business Desk",
  robots: { index: false, follow: false },
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const i = await requireBusiness();
  const sections = [
    "dashboard",
    "clients",
    "quotation-requests",
    "quotations",
    "invoices",
    "receipts",
    "payments",
    "services",
    "reports",
    ...(i.businessRole === "super_admin" ? ["settings"] : []),
  ];
  return (
    <div className="bd-shell" id="main-content">
      <aside className="bd-sidebar">
        <a className="bd-brand" href="/business-desk/dashboard">
          MEGA STRIDE
          <br />
          Business Desk<span className="text-orange-400">.</span>
        </a>
        <small>
          Technology. Business. Progress.
          <br />
          {i.businessRole.replaceAll("_", " ")} workspace
        </small>
        <nav aria-label="Business Desk">
          {sections.map((s) => (
            <a key={s} href={`/business-desk/${s}`}>
              {s.replaceAll("-", " ")}
            </a>
          ))}
        </nav>
        <a className="mt-8 block text-xs text-blue-200" href="/">
          ← Company website
        </a>
      </aside>
      <main className="bd-main">
        <div className="bd-top">
          <strong>MEGA STRIDE TECHNOLOGIES LIMITED</strong>
          <a href="/client-portal">Client portal →</a>
        </div>
        {children}
      </main>
    </div>
  );
}
