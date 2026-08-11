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
      <div className="hidden xl:block text-[7px] font-black uppercase tracking-[0.22em] text-white/25">
        Backed by
      </div>
      <div className="h-8 w-px bg-white/10 shrink-0" />
      <div className="relative h-9 w-24 shrink-0 bg-white/95 p-1">
        <Image
          src={PRIMARY_LOGO.src}
          alt={PRIMARY_LOGO.alt}
          fill
          sizes="96px"
          className="object-contain p-1"
        />
      </div>
      <div className="hidden md:block h-7 w-px bg-white/10 shrink-0" />
      <div className="flex items-center gap-2.5">
        {SECONDARY_LOGOS.map((logo, i) => (
          <div
            key={i}
            className="relative h-6 w-12 shrink-0 bg-white/95 p-[2px] opacity-80 transition-all hover:opacity-100"
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
