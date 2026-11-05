import PageShell from "@/components/page-shell";
import { requireLearner } from "@/lib/academy";
import { updateProfile } from "../actions";
export const metadata = {
  title: "Learner profile",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const i = await requireLearner();
  const { saved } = await searchParams;
  const { data, error } = await i.db
    .from("profiles")
    .select("display_name,phone")
    .eq("id", i.user.id)
    .maybeSingle();
  if (error) throw Error("Profile unavailable");
  return (
    <PageShell eyebrow="Learner profile" title="Make this workspace yours.">
      <a href="/academy/dashboard" className="text-link">
        ← Learning workspace
      </a>
      {saved && (
        <p role="status" className="mt-6 text-green-800">
          Profile saved.
        </p>
      )}
      <form action={updateProfile} className="platform-panel mt-8 max-w-xl">
        <h2 className="text-2xl font-bold">Your details</h2>
        <label className="form-label mt-5">
          Full name
          <input
            className="form-input"
            name="display_name"
            required
            minLength={2}
            maxLength={120}
            defaultValue={data?.display_name || ""}
          />
        </label>
        <p className="mt-3 text-sm text-slate-600">
          This name will appear on completion certificates. Check spelling
          before requesting a certificate.
        </p>
        <label className="form-label mt-5">
          Telephone
          <input
            name="phone"
            type="tel"
            maxLength={40}
            className="form-input"
            defaultValue={data?.phone || ""}
          />
        </label>
        <p className="mt-5 text-sm">Signed-in email: {i.user.email}</p>
        <button className="primary-button mt-6">Save profile</button>
      </form>
    </PageShell>
  );
}
