import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Model Town Garments | Men's Wear in Joya, Amroha",
  description:
    "Shop men's shirts, T-shirts, jeans, trousers, jackets, track pants, hoodies, shorts and innerwear from Model Town Garments, Joya, Amroha. All India delivery available.",
  keywords: [
    "Model Town Garments",
    "mens wear Joya",
    "mens wear Amroha",
    "clothing store Joya",
    "shirts",
    "t-shirts",
    "jeans",
    "trousers",
    "jackets",
    "mens fashion",
  ],
  authors: [{ name: "Model Town Garments" }],
  creator: "Model Town Garments",
  publisher: "Model Town Garments",
  metadataBase: new URL("https://model-town-garments.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Model Town Garments | Men's Wear",
    description:
      "Explore men's wear from shirts and T-shirts to jeans, trousers, jackets and more. All India delivery available.",
    type: "website",
    locale: "en_IN",
    siteName: "Model Town Garments",
  },
  twitter: {
    card: "summary_large_image",
    title: "Model Town Garments | Men's Wear",
    description:
      "Shop men's wear from Model Town Garments, Joya, Amroha.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
