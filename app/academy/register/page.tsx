import SiteHeader from "@/components/site-header";
import CourseRegistration from "@/components/course-registration";

export default function AcademyRegistrationPage() {
  return <main className="min-h-screen bg-slate-50 text-slate-950"><SiteHeader /><section className="inner-hero"><div className="container"><p className="section-kicker text-cyan-300">Mega Stride Academy</p><h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-.06em] text-white md:text-7xl">Online course registration.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Choose a learning pathway, complete your details and follow the bank-transfer instructions for enrolment verification.</p></div></section><section className="section-space"><div className="container"><CourseRegistration /></div></section></main>;
}
