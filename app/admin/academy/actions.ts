"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "mega_stride_admin_session";

export async function adminLogin(_previous: string, formData: FormData) {
  const password = String(formData.get("password") || "");
  const expected = process.env.MEGA_STRIDE_ADMIN_PASSWORD;
  if (!expected) return "Admin access is not configured. Add MEGA_STRIDE_ADMIN_PASSWORD in Vercel Environment Variables first.";
  if (password !== expected) return "Incorrect administrator password.";
  const jar = await cookies();
  jar.set(COOKIE, "authenticated", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  redirect("/admin/academy");
}

export async function adminLogout() {
  const jar = await cookies();
  jar.delete(COOKIE);
  redirect("/");
}

export async function isAdminAuthenticated() {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === "authenticated";
}
