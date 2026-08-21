import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/about", "/services", "/contact", "/academy"].map((url) => ({ url, lastModified: new Date() }));
}
