import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/appUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl();

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
