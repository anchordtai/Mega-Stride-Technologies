import "server-only";
import type { User } from "@supabase/supabase-js";
import { intakeDatabase, userDatabase } from "@/lib/supabase/server";

export function accountHome(role: string | null, owner: boolean) {
  if (owner) return "/super-admin";
  if (role === "instructor") return "/instructor";
  if (role) return "/admin";
  return "/academy/dashboard";
}
// Called only after Auth has returned the session's verified user. Signup
// metadata is used for display/request intent, never to grant a staff role.
export async function finishAccountSetup(db: Awaited<ReturnType<typeof userDatabase>>, user: User) {
  if (!user.email_confirmed_at) return "/account?notice=verify-email";
  const { error: ownerError } = await intakeDatabase().rpc("claim_academy_owner", { p_user: user.id });
  if (ownerError) throw Error("Your account permissions could not be prepared. Please sign in again.");
  const { data: profile, error: readError } = await db.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (readError) throw Error("Profile access is unavailable.");
  if (!profile) {
    const name = typeof user.user_metadata.display_name === "string" ? user.user_metadata.display_name.trim().slice(0,120) : "New learner";
    const { error } = await db.from("profiles").upsert({ id: user.id, display_name: name || "New learner" }, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw Error("Your learner profile could not be created.");
  }
  if (user.user_metadata.requested_role === "instructor") {
    const { data } = await db.from("instructor_requests").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!data) {
      const { error } = await db.from("instructor_requests").insert({user_id:user.id,notes:"Instructor access requested during signup; owner review required."});
      if (error && error.code !== "23505") throw Error("Your instructor request could not be saved.");
    }
  }
  const [role, owner] = await Promise.all([db.rpc("my_staff_role"),db.rpc("my_academy_owner_status")]);
  if (role.error || owner.error) throw Error("Account permissions are unavailable.");
  return accountHome(role.data as string|null,owner.data === true);
}
