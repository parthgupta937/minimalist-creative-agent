import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Brand spec §3.1: Inter is the mandated primary family for all UI type
// (Helvetica Neue is the brand-approved alternate; Inter is used throughout).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Minimalist Ad Creative Generator",
  description: "Turn a beminimalist.co product page into a verbatim, brand-safe ad creative.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-canvas text-ink">{children}</body>
    </html>
  );
}
