"use client";
import { useEffect } from "react";
import PhuketDashboard from "../PhuketDashboard";

export default function PhuketPage() {
  useEffect(() => {
    document.documentElement.className = "theme-phuket";
  }, []);

  return <PhuketDashboard />;
}
