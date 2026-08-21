import SiteHeader from "@/components/site-header";
import AcademyDashboard from "@/components/academy-dashboard";

export default function AcademyDashboardPage() {
  return <main className="min-h-screen bg-slate-50 text-slate-950"><SiteHeader /><div className="container pb-20 pt-32"><AcademyDashboard /></div></main>;
}
