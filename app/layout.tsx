import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Mega Stride Technologies Ltd | Technology & Digital Solutions", template: "%s | Mega Stride Technologies Ltd" },
  description: "Mega Stride Technologies Ltd delivers ICT solutions, software engineering, networks, cybersecurity, cloud infrastructure, automation and digital transformation services.",
  keywords: ["ICT solutions", "software development", "network infrastructure", "cybersecurity", "cloud computing", "digital transformation", "Nigeria"],
  metadataBase: new URL("https://megastridetechnologies.com"),
  openGraph: { title: "Mega Stride Technologies Ltd", description: "Technology solutions engineered for progress.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
