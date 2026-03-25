"use client";

import Image from "next/image";

const PRIMARY_LOGO = {
  src: "/logos sponsors/หน่วยบริหารและจัดการทุนด้านการพัฒนาระดับพื้นที่-บพท.-1024x494-1.webp",
  alt: "PMU-A",
};

const SECONDARY_LOGOS = [
  { src: "/logos sponsors/Ministry of Digital Economy and Society logo.jpg", alt: "Ministry of Digital Economy and Society" },
  { src: "/logos sponsors/Digital Economy Promotion Agency logo.jpg", alt: "DEPA" },
  { src: "/logos sponsors/Smart City Thailand Office Logo.jpg", alt: "Smart City Thailand" },
  { src: "/logos sponsors/SLIC logo.jpg", alt: "SLIC" },
  { src: "/logos sponsors/AXIOM AI logo.png", alt: "AXIOM AI" },
];

export default function LogoStrip({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      {/* Primary sponsor — PMU-A */}
      <div className="relative h-10 w-24 shrink-0">
        <Image
          src={PRIMARY_LOGO.src}
          alt={PRIMARY_LOGO.alt}
          fill
          sizes="96px"
          className="object-contain"
        />
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-black/10 shrink-0" />

      {/* Secondary sponsors */}
      <div className="flex items-center gap-2">
        {SECONDARY_LOGOS.map((logo, i) => (
          <div
            key={i}
            className="relative h-6 w-12 shrink-0 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all"
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              fill
              sizes="48px"
              className="object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
