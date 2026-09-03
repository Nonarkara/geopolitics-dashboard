"use client";
import { useEffect } from "react";
import PhuketDashboard from "../PhuketDashboard";

export default function PhuketPage() {
  useEffect(() => {
    // classList.add — never className =, the SSR <html> ships with
    // the Next.js font-variable classes (`__variable_*`) and overwriting
    // className would silently drop the custom font stack.
    document.documentElement.classList.add("theme-phuket");
  }, []);

  return <PhuketDashboard />;
}
