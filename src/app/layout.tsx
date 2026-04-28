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

const metadataBase = (() => {
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (!candidate) {
    return undefined;
  }

  try {
    return new URL(candidate);
  } catch {
    return undefined;
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: `Thailand Geopolitical Watch ${formatDashboardVersion()}`,
    template: `%s | Thailand Geopolitical Watch`,
  },
  description:
    "Tri-border command dashboard for Thailand's Myanmar, Cambodia, and southern frontier theatres, combining live operations, historical playback, and executive-grade intelligence design.",
  applicationName: "Thailand Geopolitical Watch",
  keywords: [
    "Thailand",
    "geopolitics",
    "border dashboard",
    "Myanmar frontier",
    "Cambodia frontier",
    "southern theatre",
    "command center",
    "operations map",
  ],
  openGraph: {
    title: "Thailand Geopolitical Watch",
    description:
      "Tri-border command dashboard for Thailand's live and archived border intelligence picture.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thailand Geopolitical Watch",
    description:
      "Executive-grade tri-border operations dashboard for live monitoring and playback.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="overflow-hidden antialiased">
        {children}
      </body>
    </html>
  );
}
