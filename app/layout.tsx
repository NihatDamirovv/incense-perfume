import type { Metadata } from "next";
import "./globals.css";
import { readSettings } from "../lib/content";
import { defaultSettings } from "./site-content";

export async function generateMetadata(): Promise<Metadata> {
  let s = defaultSettings;
  try {
    s = (await readSettings()).data;
  } catch {}
  return {
    title: s.seoTitle || s.siteName,
    description: s.seoDescription,
    icons: { icon: s.faviconImage || "/favicon.svg" },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az">
      <body className="antialiased">{children}</body>
    </html>
  );
}
