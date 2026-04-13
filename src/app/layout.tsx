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
        {/* Pre-hydration splash — visible on GitHub Pages static export while JS loads */}
        <div
          id="pre-hydration-splash"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#08090e",
            color: "white",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.4, marginBottom: 12 }}>
            Thailand Geopolitical Watch
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em" }}>
            V6.0.0
          </div>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.3, marginTop: 16 }}>
            Myanmar / Cambodia / Malaysia
          </div>
          <div style={{ marginTop: 32, width: 120, height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 1, overflow: "hidden" }}>
            <div style={{ width: "40%", height: "100%", background: "#ff3b30", borderRadius: 1, animation: "loading-bar 1.5s ease-in-out infinite" }} />
          </div>
          <noscript>
            <div style={{ marginTop: 24, fontSize: 11, opacity: 0.5 }}>
              This dashboard requires JavaScript to render.
            </div>
          </noscript>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
            #pre-hydration-splash { transition: opacity 0.3s ease-out; }
          `}} />
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          // Remove splash once React hydrates
          var observer = new MutationObserver(function(mutations) {
            var splash = document.getElementById('pre-hydration-splash');
            if (splash && document.querySelector('[data-testid]')) {
              splash.style.opacity = '0';
              setTimeout(function() { splash.remove(); }, 300);
              observer.disconnect();
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
          // Fallback: remove after 10s regardless
          setTimeout(function() {
            var splash = document.getElementById('pre-hydration-splash');
            if (splash) { splash.style.opacity = '0'; setTimeout(function() { splash.remove(); }, 300); }
          }, 10000);
        `}} />
        {children}
      </body>
    </html>
  );
}
