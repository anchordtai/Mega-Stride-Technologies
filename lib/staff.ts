import "server-only";
import { redirect } from "next/navigation";
import { currentIdentity } from "./supabase/server";
import { databaseReady } from "./supabase/config";
export async function requireStaff(
  roles = ["admin", "staff", "editor", "instructor"],
) {
  if (!databaseReady()) redirect("/account?notice=unavailable");
  const i = await currentIdentity();
  if (!i) redirect("/account");
  if (!i.user.email_confirmed_at) redirect("/account?notice=verify-email");
  if (!i.role || !roles.includes(i.role)) redirect("/academy/dashboard");
  return i;
}
