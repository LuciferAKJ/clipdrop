import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/appUrl";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/s/"],
      },
    ],
    ...(appUrl ? { sitemap: `${appUrl}/sitemap.xml` } : {}),
  };
}
