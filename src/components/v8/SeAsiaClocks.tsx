"use client";

import { useEffect, useState } from "react";

// Three ASEAN timezone groups, each anchored by its primary city + country flags
// Myanmar alone observes UTC+6:30
// UTC+7: Thailand, Cambodia, Laos, Vietnam, Indonesia (west)
// UTC+8: Malaysia, Singapore, Philippines, Brunei, Indonesia (central)
const ZONES: Array<{
  code: string;
  label: string;
  tz: string;
  offset: string;
  flags: string[];
  caption: string;
}> = [
  {
    code: "YGN",
    label: "Yangon",
    tz: "Asia/Yangon",
    offset: "UTC+6:30",
    flags: ["\u{1F1F2}\u{1F1F2}"],
    caption: "Myanmar",
  },
  {
    code: "BKK",
    label: "Bangkok",
    tz: "Asia/Bangkok",
    offset: "UTC+7",
    flags: ["\u{1F1F9}\u{1F1ED}", "\u{1F1F0}\u{1F1ED}", "\u{1F1F1}\u{1F1E6}", "\u{1F1FB}\u{1F1F3}"],
    caption: "Thailand · Cambodia · Laos · Vietnam",
  },
  {
    code: "KUL",
    label: "Kuala Lumpur",
    tz: "Asia/Kuala_Lumpur",
    offset: "UTC+8",
    flags: ["\u{1F1F2}\u{1F1FE}", "\u{1F1F8}\u{1F1EC}", "\u{1F1F5}\u{1F1ED}", "\u{1F1E7}\u{1F1F3}"],
    caption: "Malaysia · Singapore · Philippines · Brunei",
  },
];

function formatTime(d: Date, tz: string) {
  return d.toLocaleTimeString("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function SeAsiaClocks() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const LINE = "#e5e5e5";
  const INK = "#0a0a0a";
  const INK_MUTED = "#525252";

  return (
    <div
      aria-label="ASEAN timezone clocks"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(160px, 1fr))",
        gap: 0,
        borderLeft: `1px solid ${LINE}`,
        height: "100%",
      }}
    >
      {ZONES.map((z) => (
        <div
          key={z.code}
          style={{
            padding: "8px 14px",
            borderRight: `1px solid ${LINE}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: INK_MUTED,
            }}
          >
            <span>{z.offset}</span>
            <span>·</span>
            <span>{z.code}</span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 18,
              fontWeight: 600,
              marginTop: 2,
              color: INK,
              letterSpacing: "0.02em",
            }}
          >
            {now ? formatTime(now, z.tz) : "--:--:--"}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 3,
              fontSize: 13,
              lineHeight: 1,
            }}
            title={z.caption}
          >
            {z.flags.map((flag, i) => (
              <span key={i}>{flag}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
