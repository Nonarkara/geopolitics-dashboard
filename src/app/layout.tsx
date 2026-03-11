import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Border Sentinel | Thailand Geopolitics",
  description: "Advanced monitoring platform for border stability and economic stress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
