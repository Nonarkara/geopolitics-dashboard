import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thailand Geopolitics | Phuket Dashboard",
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
