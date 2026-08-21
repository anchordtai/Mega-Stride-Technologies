import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { return ["/","/about","/services","/contact"].map((url)=>({url,lastModified:new Date()})); }
