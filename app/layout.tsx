import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { DeviceRegistrar } from "@/components/DeviceRegistrar";
import { ClipboardSyncProvider } from "@/components/providers/ClipboardSyncProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app",
  ),
  title: {
    default: "ClipDrop — Share instantly, expires automatically",
    template: "%s · ClipDrop",
  },
  description:
    "Share text and files instantly across devices. No account required, expires automatically.",
  openGraph: {
    title: "ClipDrop",
    description: "Share text and files instantly across devices.",
    type: "website",
    siteName: "ClipDrop",
  },
  twitter: {
    card: "summary",
    title: "ClipDrop",
    description: "Share text and files instantly across devices.",
  },
  robots: { index: true, follow: true },
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
          className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased min-h-screen`}
        >
          {children}
          <ClipboardSyncProvider />
          <DeviceRegistrar />
          <Toaster richColors position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}
