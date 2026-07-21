// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/s/"], // share links and dashboard aren't meant to be indexed
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/sitemap.xml`,
  };
}
