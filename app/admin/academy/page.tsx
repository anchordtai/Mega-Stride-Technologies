import SiteHeader from "@/components/site-header";
import AdminDashboard from "@/components/admin-dashboard";
import AdminLoginForm from "./login-form";
import { adminLogout, isAdminAuthenticated } from "./actions";

export default async function AdminAcademyPage() {
  const authenticated = await isAdminAuthenticated();
  return <main className="min-h-screen bg-slate-50 text-slate-950"><SiteHeader />{authenticated ? <div className="container pb-20 pt-32"><div className="mb-6 flex justify-end"><form action={adminLogout}><button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:border-red-200 hover:text-red-600">Sign out</button></form></div><AdminDashboard /></div> : <div className="container pb-20 pt-32"><AdminLoginForm /></div>}</main>;
}
