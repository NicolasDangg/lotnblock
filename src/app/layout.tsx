import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lot & Block · King County property records, with receipts",
  description:
    "Type a King County address and read every public record on that lot, live from the official sites, each line linked to its source.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Reveal />
      </body>
    </html>
  );
}
