import type { Metadata } from "next";
import { Josefin_Sans, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { formatDashboardVersion } from "../lib/dashboard-version";

const display = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-display-family",
  display: "swap",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-body-family",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono-family",
  display: "swap",
});

export const metadata: Metadata = {
  title: `Thailand Geopolitics ${formatDashboardVersion()} | Border Command Dashboard`,
  description: "Advanced monitoring platform for regional stability and economic development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
