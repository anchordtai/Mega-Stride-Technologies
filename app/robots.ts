import type { MetadataRoute } from "next";
import { canonicalOrigin } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/academy/dashboard", "/account/", "/api/"],
    },
    sitemap: `${canonicalOrigin}/sitemap.xml`,
  };
}
