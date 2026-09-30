import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { DeviceRegistrar } from "@/components/DeviceRegistrar";
import { ClipboardSyncProvider } from "@/components/providers/ClipboardSyncProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { getAppUrl } from "@/lib/appUrl";

const appUrl = getAppUrl();

export const viewport: Viewport = {
  themeColor: "#090d16",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "ClipDrop — Share instantly, expires automatically",
    template: "%s · ClipDrop",
  },
  description:
    "Temporary transit for files, notes, and clipboard data across devices with optional password protection, download limits, and automatic expiration.",
  applicationName: "ClipDrop",
  authors: [{ name: "ClipDrop" }],
  keywords: [
    "file sharing",
    "temporary file transfer",
    "clipboard sync",
    "cross-device transfer",
    "auto-expiring files",
    "code snippet share",
  ],
  alternates: appUrl
    ? {
        canonical: "/",
      }
    : undefined,
  openGraph: {
    title: "ClipDrop — Share instantly, expires automatically",
    description:
      "Temporary transit for files, notes, and clipboard data across devices with automatic expiration.",
    type: "website",
    siteName: "ClipDrop",
    locale: "en_US",
    ...(appUrl ? { url: appUrl } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "ClipDrop — Share instantly, expires automatically",
    description:
      "Temporary transit for files, notes, and clipboard data across devices with automatic expiration.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased min-h-screen flex flex-col`}
        >
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
          <ClipboardSyncProvider />
          <DeviceRegistrar />
          <Toaster richColors position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}
