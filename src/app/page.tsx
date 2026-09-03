"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";

const BorderDashboard = dynamic(() => import("./BorderDashboard"), { ssr: false });
const PhuketDashboard = dynamic(() => import("./PhuketDashboard"), { ssr: false });

export default function Home() {
  const dashboardType = process.env.NEXT_PUBLIC_DASHBOARD_TYPE;
  const isPhuket = dashboardType === "PHUKET";

  useEffect(() => {
    // Apply theme based on dashboard type. Use classList.add so the
    // Next.js font-variable classes (`__variable_*`) that ship on the
    // SSR <html> are preserved — `className =` would clobber them
    // and silently drop the custom Josefin Sans / Source Sans 3 stack.
    const themeClass = isPhuket ? "theme-phuket" : "theme-border";
    document.documentElement.classList.add(themeClass);
  }, [isPhuket]);

  if (isPhuket) {
    return <PhuketDashboard />;
  }

  return <BorderDashboard />;
}
