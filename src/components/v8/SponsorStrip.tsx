"use client";

import Image from "next/image";

const SPONSORS = [
  {
    src: "/logos sponsors/%E0%B8%AB%E0%B8%99%E0%B9%88%E0%B8%A7%E0%B8%A2%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%AB%E0%B8%B2%E0%B8%A3%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%88%E0%B8%B1%E0%B8%94%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%97%E0%B8%B8%E0%B8%99%E0%B8%94%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%9E%E0%B8%B1%E0%B8%92%E0%B8%99%E0%B8%B2%E0%B8%A3%E0%B8%B0%E0%B8%94%E0%B8%B1%E0%B8%9A%E0%B8%9E%E0%B8%B7%E0%B9%89%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%88-%E0%B8%9A%E0%B8%9E%E0%B8%97.-1024x494-1.webp",
    alt: "PMU-A",
    w: 72,
  },
  { src: "/logos%20sponsors/Ministry%20of%20Digital%20Economy%20and%20Society%20logo.jpg", alt: "Ministry of Digital Economy and Society", w: 40 },
  { src: "/logos%20sponsors/Digital%20Economy%20Promotion%20Agency%20logo.jpg", alt: "DEPA", w: 40 },
  { src: "/logos%20sponsors/Smart%20City%20Thailand%20Office%20Logo.jpg", alt: "Smart City Thailand", w: 40 },
  { src: "/logos%20sponsors/SLIC%20logo.jpg", alt: "SLIC", w: 40 },
  { src: "/logos%20sponsors/AXIOM%20AI%20logo.png", alt: "AXIOM AI", w: 40 },
];

export default function SponsorStrip() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#525252",
        }}
      >
        Backed by
      </div>
      {SPONSORS.map((s, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            height: 22,
            width: s.w,
            background: "#fff",
            padding: 2,
            flexShrink: 0,
          }}
        >
          <Image src={s.src} alt={s.alt} fill sizes={`${s.w}px`} style={{ objectFit: "contain" }} unoptimized />
        </div>
      ))}
    </div>
  );
}
