import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lot & Block · King County property records",
  description:
    "Look up public records for a King County, WA address: zoning, assessed value, sales and permits, each linked to the official source.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Reveal />
      </body>
    </html>
  );
}
