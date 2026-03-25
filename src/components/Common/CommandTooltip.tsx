"use client";

import type { TooltipContent } from "../../lib/tooltip-catalog";

interface CommandTooltipProps {
  content: TooltipContent;
  children: React.ReactNode;
  /** Position relative to trigger element */
  position?: "bottom" | "right" | "left" | "top";
}

/**
 * Military-aesthetic hover tooltip showing 4 structured sections:
 * FUNCTION, SHOWS, IMPORTANCE, SOURCE (with hyperlink).
 *
 * Uses CSS group-hover — no JS event handlers needed.
 */
export default function CommandTooltip({
  content,
  children,
  position = "bottom",
}: CommandTooltipProps) {
  const positionClasses: Record<string, string> = {
    bottom: "top-full left-0 mt-1",
    right: "left-full top-0 ml-1",
    left: "right-full top-0 mr-1",
    top: "bottom-full left-0 mb-1",
  };

  return (
    <div className="group/tip relative">
      {children}
      <div
        className={`absolute ${positionClasses[position]} z-[60] hidden group-hover/tip:block pointer-events-none group-hover/tip:pointer-events-auto w-[220px] border border-white/20 bg-black text-white shadow-xl`}
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
                className="text-[8px] underline opacity-60 hover:opacity-100 transition-opacity"
              >
                {content.source}
              </a>
            ) : (
              <div className="text-[8px] opacity-60">{content.source}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
