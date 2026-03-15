"use client";

import Image from "next/image";

const LOGOS = [
  { src: "/logos sponsors/Ministry of Digital Economy and Society logo.jpg", alt: "Ministry of Digital Economy and Society" },
  { src: "/logos sponsors/Digital Economy Promotion Agency logo.jpg", alt: "depa" },
  { src: "/logos sponsors/Smart City Thailand Office Logo.jpg", alt: "Smart City Thailand" },
  { src: "/logos sponsors/SLIC logo.jpg", alt: "SLIC" },
  { src: "/logos sponsors/หน่วยบริหารและจัดการทุนด้านการพัฒนาระดับพื้นที่-บพท.-1024x494-1.webp", alt: "PMU-A" },
];

export default function LogoStrip({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {LOGOS.map((logo, i) => (
        <div key={i} className="relative h-8 w-16 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
          <Image
            src={logo.src}
            alt={logo.alt}
            fill
            sizes="64px"
            className="object-contain"
          />
        </div>
      ))}
    </div>
  );
}
