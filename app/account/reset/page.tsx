import { redirect } from "next/navigation";
import PageShell from "@/components/page-shell";
import { currentIdentity } from "@/lib/supabase/server";
import { databaseReady } from "@/lib/supabase/config";
import { accountAction } from "../actions";
export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};
export default async function ResetPage() {
  if (!databaseReady()) redirect("/account?notice=unavailable");
  if (!(await currentIdentity())) redirect("/account");
  return (
    <PageShell eyebrow="Account security" title="Choose a new password.">
      <form action={accountAction} className="platform-panel max-w-xl">
        <input type="hidden" name="mode" value="reset" />
        <label className="form-label">
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            className="form-input"
          />
        </label>
        <button className="primary-button mt-5">Update password</button>
      </form>
    </PageShell>
  );
}
