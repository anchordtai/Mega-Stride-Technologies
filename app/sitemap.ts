import type { MetadataRoute } from "next";
import { canonicalOrigin } from "@/lib/seo";
import { serviceCategories } from "@/lib/company";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/about",
    "/services",
    "/trade",
    "/contact",
    "/quotation",
    "/academy",
    "/projects",
    "/insights",
    "/privacy",
    "/terms",
    "/academy/terms",
    ...serviceCategories.map((s) => `/services/${s.slug}`),
  ].map((path) => ({ url: `${canonicalOrigin}${path}` }));
}
