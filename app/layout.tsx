import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { DeviceRegistrar } from "@/components/DeviceRegistrar";
import { ClipboardSyncProvider } from "@/components/providers/ClipboardSyncProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getAppUrl } from "@/lib/appUrl";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const appUrl = getAppUrl();

export const viewport: Viewport = {
  themeColor: "#080b11",
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
          className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased min-h-screen flex flex-col font-sans relative selection:bg-primary/25 selection:text-primary`}
        >
          {/* Subtle ambient grid pattern for precision utility look */}
          <div
            className="pointer-events-none fixed inset-0 z-0 bg-grid-pattern opacity-40"
            aria-hidden="true"
          />

          {/* Header & Main Content & Footer */}
          <Header />
          <div className="relative z-10 flex-1 flex flex-col">{children}</div>
          <Footer />

          {/* Background Services & Notifications */}
          <ClipboardSyncProvider />
          <DeviceRegistrar />
          <Toaster
            richColors
            position="top-center"
            toastOptions={{
              className:
                "!bg-card !border-border !text-foreground !shadow-lg !rounded-xl font-sans text-xs",
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
