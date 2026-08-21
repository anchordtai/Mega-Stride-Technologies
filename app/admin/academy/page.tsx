import SiteHeader from "@/components/site-header";
import AdminDashboard from "@/components/admin-dashboard";

export default function AdminAcademyPage() {
  return <main className="min-h-screen bg-slate-50 text-slate-950"><SiteHeader /><div className="container pb-20 pt-32"><AdminDashboard /></div></main>;
}
