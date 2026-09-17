import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teamwrk Touring — Paid Media Hub",
  description: "Daily paid-media pacing and ROAS for Teamwrk Touring.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
