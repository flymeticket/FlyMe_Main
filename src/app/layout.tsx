import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { env } from "@/lib/env";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlyMyTicket — Compare flights, hotels and cars worldwide",
  description:
    "FlyMyTicket compares millions of cheap flights, hotels and car rentals across 500+ travel partners — one simple search.",
  // GSC site verification — emits <meta name="google-site-verification" …>
  // only when the env var is set, so dev builds don't accidentally claim
  // ownership.
  verification: env.googleSiteVerification
    ? { google: env.googleSiteVerification }
    : undefined,
  // Tell crawlers where the proper sitemap-index lives. GSC reads this too.
  alternates: { types: { 'application/xml': `${env.siteUrl}/sitemap-index.xml` } },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-bg text-fg antialiased`}>
        {children}
      </body>
    </html>
  );
}
