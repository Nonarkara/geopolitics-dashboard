"use client";

import { useEffect, useState } from "react";
import { DASHBOARD_VERSION, formatDashboardVersion } from "../../lib/dashboard-version";
import type { DashboardStatusPayload } from "../../types/dashboard";

function isDashboardStatusPayload(value: unknown): value is DashboardStatusPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    typeof value.version === "string"
  );
}

export default function DashboardVersionBadge({
  className = "",
}: {
  className?: string;
}) {
  const [version, setVersion] = useState(DASHBOARD_VERSION);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/api/status");
        const payload: unknown = await response.json();

        if (active && isDashboardStatusPayload(payload)) {
          setVersion(payload.version);
        }
      } catch {
        if (active) {
          setVersion(DASHBOARD_VERSION);
        }
      }
    };

    void load();
    const interval = setInterval(() => {
      void load();
    }, 5 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <span
      data-testid="dashboard-version-badge"
      className={`inline-flex items-center border px-2 py-0.5 text-[13px] font-mono uppercase tracking-[0.18em] ${className}`.trim()}
    >
      {formatDashboardVersion(version)}
    </span>
  );
}
