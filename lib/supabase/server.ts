import "server-only";
import {cache} from "react";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { databaseConfig } from "./config";

export async function userDatabase() {
  const { url, key } = databaseConfig();
  const jar = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) =>
            jar.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
            }),
          );
        } catch {
          /* Read-only render: refresh occurs in actions. */
        }
      },
    },
  });
}
export function intakeDatabase() {
  const { url } = databaseConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Server intake is unavailable.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export const currentIdentity=cache(async function currentIdentity() {
  const db = await userDatabase();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) return null;
  const [role, owner] = await Promise.all([db.rpc("my_staff_role"), db.rpc("my_academy_owner_status")]);
  return { user, role: role.data as string | null, isSuperAdmin: !owner.error && owner.data === true, db };
});
