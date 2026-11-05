"use server";
import { redirect } from "next/navigation";
// The legacy unsigned cookie is deliberately ignored. All access uses Supabase identity and DB roles.
export async function adminLogin() {
  redirect("/account");
}
export async function adminLogout() {
  redirect("/account");
}
export async function isAdminAuthenticated() {
  return false;
}
