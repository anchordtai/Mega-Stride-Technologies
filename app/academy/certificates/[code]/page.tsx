import { notFound } from "next/navigation";
import PageShell from "@/components/page-shell";
import { intakeDatabase } from "@/lib/supabase/server";
import { databaseReady } from "@/lib/supabase/config";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Certificate verification",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!/^[a-f0-9]{32}$/.test(code) || !databaseReady()) notFound();
  const { data: c, error } = await intakeDatabase()
    .from("certificates")
    .select("code,course_title,issued_at,revoked_at")
    .eq("code", code)
    .maybeSingle();
  if (error) throw Error("Verification unavailable");
  if (!c) notFound();
  return (
    <PageShell
      eyebrow="Certificate verification"
      title={
        c.revoked_at
          ? "Certificate withdrawn."
          : "A verified learning milestone."
      }
      intro="Mega Stride Academy · Independent professional training"
    >
      <section className="platform-panel max-w-3xl">
        <p className="section-kicker">
          {c.revoked_at ? "Withdrawn" : "Valid completion record"}
        </p>
        <h2 className="mt-5 text-3xl font-bold">{c.course_title}</h2>
        <p className="mt-5">
          Issued:{" "}
          {new Date(c.issued_at).toLocaleDateString("en-NG", {
            timeZone: "Africa/Lagos",
            dateStyle: "long",
          })}
        </p>
        <p className="mt-4 break-all text-sm">
          Certificate reference: {c.code}
        </p>
        <p className="mt-5 leading-8 text-slate-600">
          This page confirms the course and record status. Compare the holder’s
          name against the original certificate. Holder contact details are not
          published. This is a Mega Stride Academy completion certificate, not a
          manufacturer certification.
        </p>
        <a
          className="primary-button mt-6"
          href={`/api/academy/certificates/${code}`}
        >
          Download my certificate (sign-in required) ↓
        </a>
      </section>
    </PageShell>
  );
}
