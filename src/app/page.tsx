"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";

const BorderDashboard = dynamic(() => import("./BorderDashboard"), { ssr: false });
const PhuketDashboard = dynamic(() => import("./PhuketDashboard"), { ssr: false });

export default function Home() {
  const dashboardType = process.env.NEXT_PUBLIC_DASHBOARD_TYPE;
  const isPhuket = dashboardType === "PHUKET";

  useEffect(() => {
    // Apply theme based on dashboard type
    const themeClass = isPhuket ? "theme-phuket" : "theme-border";
    document.documentElement.className = themeClass;
  }, [isPhuket]);

  if (isPhuket) {
    return <PhuketDashboard />;
  }

  return <BorderDashboard />;
}
