import type { Metadata } from "next";
import "./globals.css";
import { formatDashboardVersion } from "../lib/dashboard-version";
import SkipLink from "../components/Common/SkipLink";

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
    <html lang="en">
      <body className="overflow-hidden antialiased">
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
