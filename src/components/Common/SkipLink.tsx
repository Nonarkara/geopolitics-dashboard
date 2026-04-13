"use client";

export default function SkipLink() {
  return (
    <a
      href="#dashboard-content"
      className="sr-only-focusable fixed top-2 left-2 z-[100] bg-white text-black px-4 py-2 text-[11px] font-black uppercase tracking-wider shadow-lg"
    >
      Skip to dashboard content
    </a>
  );
}
