import { canonicalOrigin } from "@/lib/seo";
import type { Metadata } from "next";
import "./globals.css";
import "./commerce-academy.css";
import "./site-overrides.css";
import WhatsAppFloat from "@/components/whatsapp-float";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  metadataBase: new URL(canonicalOrigin),
  alternates: { canonical: "/" },
  title: {
    default:
      "Mega Stride Technologies Ltd | Technology, Training & Global Trade",
    template: "%s | Mega Stride Technologies Ltd",
  },
  description:
    "Mega Stride Technologies Ltd delivers ICT solutions, professional technology training, and ICT-related importation and exportation services in Nigeria.",
  keywords: [
    "Mega Stride Technologies Ltd",
    "ICT solutions",
    "software development",
    "network infrastructure",
    "cybersecurity",
    "cloud computing",
    "digital transformation",
    "technology training",
    "importation",
    "exportation",
    "Nigeria",
  ],

  openGraph: {
    title: "Mega Stride Technologies Ltd",
    description: "Technology engineered for the next stride.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Mega Stride Technologies Limited",
              url: canonicalOrigin,
              email: "info@megastride.com.ng",
              telephone: "+2348138463804",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Abuja",
                addressCountry: "NG",
              },
            }).replace(/</g, "\\u003c"),
          }}
        />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
        <SiteFooter />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
