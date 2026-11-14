import PageShell from "@/components/page-shell";
import CheckoutButton from "@/components/checkout-button";
import CourseShare from "@/components/course-share";
import { currentIdentity,userDatabase } from "@/lib/supabase/server";
import { databaseReady } from "@/lib/supabase/config";
import { paymentMode } from "@/lib/payment-security";
import { registerCourse } from "../actions";
import { courseRegistrationPath } from "@/lib/academy-navigation";
export const metadata={title:"Register for an Academy course",robots:{index:false,follow:false}};
const notices:Record<string,string>={registered:"Your course registration is saved. Paid lessons unlock after your payment is verified.","registration-error":"Registration could not be completed. Check the course or contact Academy support if your registration was cancelled.",terms:"Accept the Academy terms to register.",unavailable:"This course is not available for registration."};
export default async function Registration({searchParams}:{searchParams:Promise<{course?:string;notice?:string}>}) {
  const {course,notice}=await searchParams;
  const db=databaseReady()?await userDatabase():null;
  const result=db?await db.from("courses").select("id,title,slug,price_minor,currency,duration_text").eq("status","published").order("title"):null;
  if(result?.error)throw Error("Course registration is temporarily unavailable.");
  const courses=result?.data||[];
  const selected=courses.find(c=>c.slug===course||c.title===course);
  const identity=await currentIdentity();
  const next=selected?courseRegistrationPath(selected.slug):"/academy";
  const mode=paymentMode();
  const [enrolment,access]=identity&&selected?await Promise.all([
    identity.db.from("enrolments").select("status").eq("user_id",identity.user.id).eq("course_id",selected.id).maybeSingle(),
    identity.db.rpc("my_learning_access",{p_course:selected.id}),
  ]):[null,null];
  if(enrolment?.error||access?.error)throw Error("Your registration status could not be checked.");
  const registered=!!enrolment?.data;
  const cancelled=enrolment?.data?.status==="cancelled";
  return <PageShell eyebrow="Mega Stride Academy · Course registration" title="Your next course starts here." intro="Sign up → verify your email → sign in → register for a course → pay securely → start learning.">
    {notice&&<p role="status" className="platform-panel mb-7">{notices[notice]||"Check your course registration below."}</p>}
    {!selected ? <section className="platform-panel"><h2 className="text-2xl font-bold">Choose your course</h2><p className="mt-4">Registration is separate from payment. You can return to pay from your learner dashboard.</p><ul className="mt-6 space-y-5">{courses.map(c=><li key={c.id}><a className="text-link" href={courseRegistrationPath(c.slug)}>{c.title} →</a></li>)}</ul>{!courses.length&&<p className="mt-5">Courses are temporarily unavailable.</p>}</section> : <article className="platform-panel max-w-4xl">
      <p className="section-kicker">{access?.data===true?"Ready to learn":registered?`Registration ${enrolment?.data?.status}`:"Register your place"}</p>
      <h2 className="mt-4 text-3xl font-bold">{selected.title}</h2>
      <p className="mt-4 text-xl font-bold">{selected.price_minor===null?"Fees to be confirmed":new Intl.NumberFormat("en-NG",{style:"currency",currency:selected.currency}).format(selected.price_minor/100)}</p>
      {selected.duration_text&&<p className="mt-3">{selected.duration_text}</p>}
      {!identity ? <div className="mt-7"><p>Create and verify your account, then sign in to register for this course.</p><div className="mt-5 flex flex-wrap gap-4"><a className="primary-button" href={`/account/signup?next=${encodeURIComponent(next)}`}>1. Create an account</a><a className="secondary-button" href={`/account?next=${encodeURIComponent(next)}`}>2. Sign in</a></div></div> : !identity.user.email_confirmed_at ? <p className="mt-7">Verify your email and sign in before registering.</p> : access?.data===true ? <a className="primary-button mt-7" href={`/academy/learn/${selected.id}`}>Open course →</a> : cancelled ? <p className="mt-7">Your registration was cancelled. <a href="/academy/support" className="text-link">Contact Academy support</a> before making another payment.</p> : !registered ? selected.price_minor===null ? <p className="mt-7">Registration opens once fees are confirmed. <a href={`/academy/enquire?course=${encodeURIComponent(selected.title)}`} className="text-link">Contact the Academy</a>.</p> : <form action={registerCourse} className="mt-7"><input type="hidden" name="course" value={selected.id}/><label className="flex gap-3 leading-7 text-sm"><input type="checkbox" name="consent" required/><span>I accept the <a href="/academy/terms" className="underline">Academy terms</a> for this course. Registration does not charge me. Paid course access requires verified payment.</span></label><button className="primary-button mt-5">Register for this course</button></form> : <div className="mt-7"><h3 className="text-xl font-bold">Next: complete your payment</h3><p className="my-4 leading-8">Your place is registered. Lessons, downloads and assessments unlock only after the payment for this course has been verified.</p>{mode==="live"||mode==="test"&&identity.role==="admin"?<CheckoutButton course={selected.id} test={mode==="test"}/>:<p role="status" className="rounded-2xl bg-amber-50 p-5 leading-7">Online payment is awaiting activation. Your registration is saved; return here from your dashboard when payment opens. <a className="text-link" href="/academy/support">Contact Academy support →</a></p>}</div>}
      <div className="mt-7 flex flex-wrap gap-5"><a className="text-link" href={`/academy/courses/${selected.slug}`}>Course details →</a>{identity&&<a className="text-link" href="/academy/dashboard">My learning dashboard →</a>}<a className="text-link" href="/academy/register">Choose another course →</a></div>
      <CourseShare title={selected.title} slug={selected.slug}/>
    </article>}
    <p className="mt-8 text-sm leading-7">Instructor applications require super-admin approval. Independent training does not confer manufacturer certification.</p>
  </PageShell>;
}
