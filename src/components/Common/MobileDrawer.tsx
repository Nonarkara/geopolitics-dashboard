"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

type MobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * Bottom-sheet drawer for mobile/tablet (§11.8). Slides up over the map so the
 * command sidebar stays reachable below the `md` breakpoint, where the desktop
 * <aside> is hidden. Above `md` (768px — iPad portrait and most foldable
 * unfolded modes) the desktop layout shows directly. Geometric, hairline-
 * bordered, single dark surface — no border-radius, gradient, or shadow
 * (§11.6 / §14). Theme tokens with fallbacks so it reads correctly on both
 * the border and Phuket dashboards.
 */
export default function MobileDrawer({ isOpen, onClose, title, children }: MobileDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end min-[744px]:hidden md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />

      <div className="relative flex max-h-[85dvh] flex-col border-t border-[var(--line,rgba(255,255,255,0.16))] bg-[var(--bg-raised,#0a0e14)]">
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--line,rgba(255,255,255,0.16))] pl-4">
          <span className="text-[14px] font-black uppercase tracking-[0.2em] text-white">
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-11 w-11 items-center justify-center text-2xl leading-none text-white/70 hover:text-white"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
