"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { userDatabase } from "@/lib/supabase/server";
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
  const email = String(form.get("email") || "").trim();
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
    const { error } = await db.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/account/confirm` },
    });
    if (error) redirect("/account?notice=failed");
    redirect("/account?notice=confirmation");
  }
  if (mode !== "login") redirect("/account?notice=invalid");
  // Supabase Auth rate limits login requests. All returned errors remain generic.
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) redirect("/account?notice=failed");
  redirect("/academy/dashboard");
}
