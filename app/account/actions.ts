"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { intakeDatabase, userDatabase } from "@/lib/supabase/server";
import { academyReturnPath } from "@/lib/academy-navigation";
import { finishAccountSetup } from "@/lib/account-access";
import { databaseReady } from "@/lib/supabase/config";
const accountSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(12).max(128),
});
export async function accountAction(form: FormData) {
  const mode = String(form.get("mode"));
  const next = academyReturnPath(form.get("next"));
  const signinPath = (notice: string) => `/account?${new URLSearchParams({notice,...(next?{next}:{})})}`;
  const signupPath = (notice: string) => `/account/signup?${new URLSearchParams({notice,...(next?{next}:{})})}`;
  if (!databaseReady()) redirect("/account?notice=unavailable");
  const db = await userDatabase();
  if (mode === "logout") {
    await db.auth.signOut();
    redirect("/account");
  }
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const origin = process.env.SITE_URL || "http://localhost:3000";
  if (mode === "recover") {
    if (!z.email().safeParse(email).success)
      redirect("/account?notice=invalid");
    await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/account/confirm?next=/account/reset`,
    });
    redirect("/account?notice=recovery");
  }
  if (mode === "reset") {
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user || password.length < 12 || password.length > 128)
      redirect("/account?notice=invalid");
    const { error } = await db.auth.updateUser({ password });
    if (error) redirect("/account?notice=failed");
    await db.auth.signOut();
    redirect("/account?notice=updated");
  }
  const v = accountSchema.safeParse({ email, password });
  if (!v.success) redirect(mode === "register" ? signupPath("invalid") : signinPath("invalid"));
  if (mode === "register") {
    if (process.env.ACADEMY_PUBLIC_SIGNUP_ENABLED !== "true") {
      const {data:allowed,error}=await intakeDatabase().rpc("owner_signup_available",{p_email:email});
      if(error||allowed!==true)redirect(signupPath("owner-only"));
    }
    if (form.get("consent") !== "on") redirect(signupPath("invalid"));
    const displayName = z.string().trim().min(2).max(120).safeParse(form.get("display_name"));
    const requestedRole = z.enum(["student", "instructor"]).safeParse(form.get("requested_role"));
    if (!displayName.success || !requestedRole.success) redirect(signupPath("invalid"));
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/account/confirm${next ? `?next=${encodeURIComponent(next)}` : ""}`, data: {display_name:displayName.data, requested_role:requestedRole.data} },
    });
    if (error) {
      if (["email_address_not_authorized", "email_address_invalid"].includes(error.code || "")) redirect(signupPath("email-setup"));
      if (error.status === 429) redirect(signupPath("rate-limit"));
      redirect(signupPath("failed"));
    }
    if (data.session && data.user?.email_confirmed_at) { await finishAccountSetup(db,data.user); await db.auth.signOut(); redirect(signinPath("verified")); }
    redirect(signinPath("confirmation"));
  }
  if (mode !== "login") redirect("/account?notice=invalid");
  // Supabase Auth rate limits login requests. All returned errors remain generic.
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect(signinPath("failed"));
  const home = await finishAccountSetup(db,data.user);
  redirect(data.user.email_confirmed_at && next ? next : home);
}
