import type { Metadata } from "next";
import "./globals.css";
import "./commerce-academy.css";
import "./site-overrides.css";
import WhatsAppFloat from "@/components/whatsapp-float";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  title: { default: "Mega Stride Technologies Ltd | Technology, Training & Global Trade", template: "%s | Mega Stride Technologies Ltd" },
  description: "Mega Stride Technologies Ltd delivers ICT solutions, professional technology training, and ICT-related importation and exportation services in Nigeria.",
  keywords: ["Mega Stride Technologies Ltd", "ICT solutions", "software development", "network infrastructure", "cybersecurity", "cloud computing", "digital transformation", "technology training", "importation", "exportation", "Nigeria"],
  icons: { icon: "/mega-stride-logo-fixed.svg", apple: "/mega-stride-logo-fixed.svg" },
  openGraph: { title: "Mega Stride Technologies Ltd", description: "Technology engineered for the next stride.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<SiteFooter /><WhatsAppFloat /></body></html>;
}
