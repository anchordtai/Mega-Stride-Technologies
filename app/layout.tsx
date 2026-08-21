import type { Metadata } from "next";
import "./globals.css";
import "./commerce-academy.css";
import WhatsAppFloat from "@/components/whatsapp-float";

export const metadata: Metadata = {
  title: { default: "Mega Stride Technologies Ltd | Technology, Training & Global Trade", template: "%s | Mega Stride Technologies Ltd" },
  description: "Mega Stride Technologies Ltd delivers ICT solutions, professional technology training, and ICT-related importation and exportation services in Nigeria.",
  keywords: ["ICT solutions", "software development", "network infrastructure", "cybersecurity", "cloud computing", "digital transformation", "technology training", "importation", "exportation", "Nigeria"],
  openGraph: { title: "Mega Stride Technologies Ltd", description: "Technology engineered for the next stride.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<div className="border-t border-white/10 bg-[#06101f] px-5 py-3 text-center text-[11px] font-semibold tracking-[.08em] text-slate-500">MEGA STRIDE TECHNOLOGIES LTD <span className="mx-2 text-slate-700">•</span> COMPANY REGISTRATION NO. 9629475</div><WhatsAppFloat /></body></html>;
}
