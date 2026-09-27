import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Access Share",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
