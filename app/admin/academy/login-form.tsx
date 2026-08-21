"use client";

import { useActionState } from "react";
import { adminLogin } from "./actions";

export default function AdminLoginForm() {
  const [message, action, pending] = useActionState(adminLogin, "");
  return <form action={action} className="mx-auto max-w-md rounded-[30px] border border-slate-200 bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,.08)]"><p className="section-kicker">Restricted workspace</p><h1 className="mt-3 text-3xl font-black tracking-[-.04em]">Academy administrator</h1><p className="mt-3 text-sm leading-6 text-slate-500">Sign in with the administrator password configured in the Vercel environment.</p><label className="form-label mt-7">Administrator password<input name="password" type="password" className="form-input" autoComplete="current-password" required /></label>{message && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{message}</p>}<button className="primary-button mt-6 w-full justify-center" disabled={pending}>{pending ? "Signing in..." : "Sign in securely →"}</button></form>;
}
