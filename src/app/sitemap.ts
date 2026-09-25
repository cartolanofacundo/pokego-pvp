import type { MetadataRoute } from "next";
import { DATA_UPDATED, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = DATA_UPDATED || undefined;
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/combate/`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/rankeador/`, lastModified, changeFrequency: "weekly", priority: 0.8 },
  ];
}
