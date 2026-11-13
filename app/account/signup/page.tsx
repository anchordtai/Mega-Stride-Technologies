import PageShell from "@/components/page-shell";
import { databaseReady } from "@/lib/supabase/config";
import { accountAction } from "../actions";
export const metadata={title:"Create an Academy account",robots:{index:false,follow:false}};
const messages:Record<string,string>={invalid:"Enter your name, a valid email, a password of 12–128 characters and accept the Academy terms.",failed:"Registration could not be completed. Check your details or try again later.","email-setup":"Verification email delivery needs the Academy sender configuration. Contact the Academy; verification is still required.","rate-limit":"Too many authentication requests. Please wait before trying again."};
export default async function Signup({searchParams}:{searchParams:Promise<{notice?:string}>}){
 const {notice}=await searchParams;
 const enabled=databaseReady()&&process.env.ACADEMY_PUBLIC_SIGNUP_ENABLED==="true";
 return <PageShell eyebrow="Join Mega Stride Academy" title="Start your learning journey." intro="Create one verified account. Your assigned role determines the workspace you can access.">
 <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
 <form action={accountAction} className="platform-panel">
 <h2 className="text-2xl font-bold">Create your account</h2>
 {notice&&<p role="alert" className="mt-5 rounded-xl bg-amber-50 p-4">{messages[notice]||messages.failed}</p>}
 {!enabled&&<p role="status" className="mt-5">Signup is being prepared. Please check again shortly.</p>}
 <input type="hidden" name="mode" value="register"/>
 <fieldset disabled={!enabled}>
 <legend className="sr-only">Account details</legend>
 <label className="form-label mt-6">Full name<input name="display_name" className="form-input" autoComplete="name" required minLength={2} maxLength={120}/></label>
 <label className="form-label mt-5">Email address<input name="email" type="email" className="form-input" autoComplete="email" required maxLength={254}/></label>
 <label className="form-label mt-5">Password · at least 12 characters<input name="password" type="password" className="form-input" autoComplete="new-password" required minLength={12} maxLength={128}/></label>
 <label className="form-label mt-5">Account purpose<select name="requested_role" className="form-input" defaultValue="student"><option value="student">Learn as a student</option><option value="instructor">Apply to teach · approval required</option></select></label>
 <p className="mt-3 text-sm leading-7 text-slate-600">Instructor applications start with student access. Only the super admin can approve teaching or administrative permissions.</p>
 <label className="mt-5 flex gap-3 text-sm leading-7"><input type="checkbox" name="consent" required/><span>I accept the <a className="underline" href="/academy/terms">Academy terms</a> and have read the <a className="underline" href="/privacy">privacy notice</a>.</span></label>
 <button className="primary-button mt-6">Create account & verify email</button>
 </fieldset>
 <p className="mt-6">Already registered? <a href="/account" className="text-link">Sign in →</a></p>
 </form>
 <aside className="platform-panel"><h2 className="text-2xl font-bold">Your account. Your workspace.</h2><ol className="mt-5 list-decimal space-y-4 pl-5 leading-8"><li>Create an account and verify your email.</li><li>Sign in to reach the workspace assigned to your role.</li><li>Students manage their own courses, progress and submissions.</li><li>Approved instructors teach their assigned courses.</li><li>The designated owner manages users, course assignments and audited test access in the super-admin dashboard.</li></ol><p className="mt-6 text-sm leading-7">Registration creates an account. Protected course access still requires verified course payment or an authorised, recorded exception.</p></aside>
 </div></PageShell>;
}
