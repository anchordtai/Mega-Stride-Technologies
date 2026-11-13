"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { userDatabase } from "@/lib/supabase/server";
import { finishAccountSetup } from "@/lib/account-access";
import { databaseReady } from "@/lib/supabase/config";
const accountSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(12).max(128),
});
export async function accountAction(form: FormData) {
  const mode = String(form.get("mode"));
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
  if (!v.success) redirect("/account?notice=invalid");
  if (mode === "register") {
    if (process.env.ACADEMY_PUBLIC_SIGNUP_ENABLED !== "true")
      redirect("/account?notice=unavailable");
    if (form.get("consent") !== "on") redirect("/account?notice=invalid");
    const displayName = z.string().trim().min(2).max(120).safeParse(form.get("display_name"));
    const requestedRole = z.enum(["student", "instructor"]).safeParse(form.get("requested_role"));
    if (!displayName.success || !requestedRole.success) redirect("/account/signup?notice=invalid");
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/account/confirm`, data: {display_name:displayName.data, requested_role:requestedRole.data} },
    });
    if (error) {
      if (["email_address_not_authorized", "email_address_invalid"].includes(error.code || "")) redirect("/account/signup?notice=email-setup");
      if (error.status === 429) redirect("/account/signup?notice=rate-limit");
      redirect("/account/signup?notice=failed");
    }
    if (data.session && data.user?.email_confirmed_at) redirect(await finishAccountSetup(db,data.user));
    redirect("/account?notice=confirmation");
  }
  if (mode !== "login") redirect("/account?notice=invalid");
  // Supabase Auth rate limits login requests. All returned errors remain generic.
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect("/account?notice=failed");
  redirect(await finishAccountSetup(db,data.user));
}
