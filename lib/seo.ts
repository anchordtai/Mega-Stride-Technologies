import type { Metadata } from "next";
export const canonicalOrigin = "https://www.megastride.com.ng";
export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: `${canonicalOrigin}${path}` },
    openGraph: {
      title,
      description,
      url: `${canonicalOrigin}${path}`,
      siteName: "Mega Stride Technologies Limited",
      type: "website",
    },
    twitter: { card: "summary", title, description },
  };
}
