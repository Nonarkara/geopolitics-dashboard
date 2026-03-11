import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentinel X | Thailand Geopolitical Watch",
  description: "Thailand Geopolitical Watch: Sentinel X — Advanced monitoring platform for border stability, provincial intelligence, and economic stress by Assoc. Prof. Poon Thiengburanathum, PhD.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[var(--bg)] text-[var(--ink)] antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
