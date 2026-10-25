"use client";

import { useEffect, useState } from "react";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const MOBILE_BREAKPOINT = 768;

/**
 * Auto-scales the dashboard to fit any screen.
 *
 * Designed at 1920x1080 reference resolution. On larger screens (72" TV),
 * scales up. On smaller screens (laptop), scales down. On mobile (<768px),
 * bypasses scaling and shows a scrollable single-column layout.
 *
 * No manual zoom needed — looks perfect on every device.
 */
export default function DashboardScaler({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    function updateScale() {
      const w = window.innerWidth;
      const h = window.innerHeight;

      if (w < MOBILE_BREAKPOINT) {
        setIsMobile(true);
        setScale(1);
        return;
      }

      setIsMobile(false);
      const scaleX = w / DESIGN_WIDTH;
      const scaleY = h / DESIGN_HEIGHT;
      setScale(Math.min(scaleX, scaleY));
    }

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // Before hydration, show at design size (avoids flash)
  if (!mounted) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-black">
        <div style={{ width: DESIGN_WIDTH, height: DESIGN_HEIGHT }}>
          {children}
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="w-screen min-h-screen bg-black overflow-y-auto">
        {children}
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <div
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
