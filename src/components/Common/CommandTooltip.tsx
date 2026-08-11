"use client";

import { useRef, useState } from "react";
import type { TooltipContent } from "../../lib/tooltip-catalog";

interface CommandTooltipProps {
  content: TooltipContent;
  children: React.ReactNode;
  /** Position relative to trigger element */
  position?: "bottom" | "right" | "left" | "top";
}

const TOOLTIP_WIDTH = 220;
const EDGE_PADDING = 8;

/**
 * Military-aesthetic hover tooltip showing 4 structured sections:
 * FUNCTION, SHOWS, IMPORTANCE, SOURCE (with hyperlink).
 *
 * Positioned via getBoundingClientRect + fixed coordinates rather than an
 * absolute offset off the trigger — the base-map/overlay grids sit inside
 * `overflow-hidden` panels, and a plain `left-full`/`right-full` offset both
 * gets clipped by that ancestor and can run past the viewport edge on
 * mobile. Fixed positioning escapes both; the clamp keeps it on-screen.
 */
export default function CommandTooltip({
  content,
  children,
  position = "bottom",
}: CommandTooltipProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    let top = position === "top" ? rect.top - 4 : rect.bottom + 4;
    const left =
      position === "right"
        ? rect.right + 4
        : position === "left"
          ? rect.left - TOOLTIP_WIDTH - 4
          : rect.left;

    const clampedLeft = Math.min(
      Math.max(left, EDGE_PADDING),
      window.innerWidth - TOOLTIP_WIDTH - EDGE_PADDING,
    );
    top = Math.min(Math.max(top, EDGE_PADDING), window.innerHeight - EDGE_PADDING);

    setCoords({ top, left: clampedLeft });
  };

  const hide = () => setCoords(null);

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {coords && (
        <div
          style={{ position: "fixed", top: coords.top, left: coords.left, width: TOOLTIP_WIDTH }}
          className="z-[60] pointer-events-none border border-white/20 bg-black text-white shadow-xl"
        >
          <div className="px-2.5 py-2 space-y-1.5">
            {/* FUNCTION */}
            <div>
              <div className="text-[6px] font-black uppercase tracking-[0.3em] opacity-40 mb-0.5">
                Function
              </div>
              <div className="text-[8px] leading-tight opacity-80">
                {content.fn}
              </div>
            </div>

            {/* SHOWS */}
            <div>
              <div className="text-[6px] font-black uppercase tracking-[0.3em] opacity-40 mb-0.5">
                Shows
              </div>
              <div className="text-[8px] leading-tight opacity-80">
                {content.shows}
              </div>
            </div>

            {/* IMPORTANCE */}
            <div>
              <div className="text-[6px] font-black uppercase tracking-[0.3em] opacity-40 mb-0.5">
                Importance
              </div>
              <div className="text-[8px] leading-tight opacity-80">
                {content.importance}
              </div>
            </div>

            {/* SOURCE */}
            <div className="border-t border-white/10 pt-1.5">
              <div className="text-[6px] font-black uppercase tracking-[0.3em] opacity-40 mb-0.5">
                Source
              </div>
              {content.sourceUrl && content.sourceUrl !== "#" ? (
                <a
                  href={content.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[8px] underline opacity-60 hover:opacity-100 transition-opacity pointer-events-auto"
                >
                  {content.source}
                </a>
              ) : (
                <div className="text-[8px] opacity-60">{content.source}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
