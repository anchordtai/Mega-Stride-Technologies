import PageShell from "@/components/page-shell";
import { databaseReady } from "@/lib/supabase/config";
import { accountAction } from "./actions";
export const metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};
const notices: Record<string, string> = {
  unavailable:
    "Account access will open when the independent Academy platform is activated.",
  invalid:
    "Please check the required details. Passwords must contain at least 12 characters.",
  failed:
    "We could not complete this request. Check your details or try again later.",
  confirmation:
    "If registration is available for this address, check your email to confirm your account.",
  recovery:
    "If an account exists for this address, password recovery instructions will be sent.",
  updated: "Your password has been updated. Sign in again.",
};
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const ready = databaseReady();
  return (
    <PageShell
      eyebrow="Your account"
      title="Learn. Build. Advance."
      intro="Secure access for Mega Stride learners and authorised staff."
    >
      {(!ready || notice) && (
        <p
          role="status"
          className="mb-8 rounded-xl bg-blue-50 p-5 text-blue-950"
        >
          {!ready
            ? notices.unavailable
            : notices[notice || ""] || "Please try again."}
        </p>
      )}
      {process.env.ACADEMY_PUBLIC_SIGNUP_ENABLED !== "true" && (
        <p className="mb-8 leading-7 text-slate-600">
          Learner account access is arranged after enrolment confirmation.{" "}
          <a
            href="/academy/register"
            className="font-bold text-blue-700 underline"
          >
            Send a training enquiry
          </a>{" "}
          to discuss your course.
        </p>
      )}
      <div className="grid gap-8 lg:grid-cols-2">
        {["login", "register"]
          .filter(
            (mode) =>
              mode === "login" ||
              process.env.ACADEMY_PUBLIC_SIGNUP_ENABLED === "true",
          )
          .map((mode) => (
            <form key={mode} action={accountAction} className="platform-panel">
              <input type="hidden" name="mode" value={mode} />
              <h2 className="text-2xl font-bold">
                {mode === "login" ? "Sign in" : "Create a learner account"}
              </h2>
              <fieldset disabled={!ready}>
                <legend className="sr-only">Account details</legend>
                <label className="form-label mt-6">
                  Email
                  <input
                    className="form-input"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    maxLength={254}
                  />
                </label>
                <label className="form-label mt-5">
                  Password (12 characters minimum)
                  <input
                    className="form-input"
                    type="password"
                    name="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                </label>
                {mode === "register" && (
                  <label className="mt-5 flex gap-3 text-sm">
                    <input type="checkbox" name="consent" required />
                    <span>
                      I accept the{" "}
                      <a className="underline" href="/academy/terms">
                        Academy terms
                      </a>{" "}
                      and have read the{" "}
                      <a className="underline" href="/privacy">
                        privacy notice
                      </a>
                      .
                    </span>
                  </label>
                )}
                <button className="primary-button mt-6">
                  {mode === "login" ? "Sign in" : "Register account"}
                </button>
              </fieldset>
            </form>
          ))}
      </div>
      <form action={accountAction} className="platform-panel mt-8 max-w-xl">
        <h2 className="text-xl font-bold">Forgot your password?</h2>
        <input type="hidden" name="mode" value="recover" />
        <fieldset disabled={!ready}>
          <legend className="sr-only">Password recovery</legend>
          <label className="form-label mt-5">
            Email
            <input
              className="form-input"
              type="email"
              name="email"
              autoComplete="email"
              required
            />
          </label>
          <button className="primary-button mt-5">
            Send recovery instructions
          </button>
        </fieldset>
      </form>
    </PageShell>
  );
}
