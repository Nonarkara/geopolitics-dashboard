import type { Metadata } from "next";
import "./globals.css";
import { formatDashboardVersion } from "../lib/dashboard-version";

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
    <html lang="en">
      <body className="antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
