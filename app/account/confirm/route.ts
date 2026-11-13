import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { finishAccountSetup } from "@/lib/account-access";
import { userDatabase } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next =
    url.searchParams.get("next") === "/account/reset"
      ? "/account/reset"
      : "/academy/dashboard";
  try {
    const db = await userDatabase();
    const code = url.searchParams.get("code");
    const hash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type");
    if (code) {
      const { error } = await db.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (hash && ["email", "signup", "recovery"].includes(type || "")) {
      const { error } = await db.auth.verifyOtp({
        token_hash: hash,
        type: type as EmailOtpType,
      });
      if (error) throw error;
    } else throw Error();
    if (next === "/account/reset") return NextResponse.redirect(new URL(next,url.origin));
    const {data:{user},error} = await db.auth.getUser();
    if (error || !user) throw Error("Confirmation requires a valid session");
    const destination = await finishAccountSetup(db,user);
    return NextResponse.redirect(new URL(destination, url.origin));
  } catch {
    return NextResponse.redirect(new URL("/account?notice=failed", url.origin));
  }
}
