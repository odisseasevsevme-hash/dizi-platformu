import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { BRAND_NAME } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: "Diziler ve filmler",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Suspense>
          <Header />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
