"use client";

import { useEffect, useState } from "react";
import { fallbackNews } from "../../lib/mock-data";
import type { NewsResponse } from "../../types/dashboard";

function isNewsResponse(value: unknown): value is NewsResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "news" in value &&
    Array.isArray(value.news)
  );
}

function severityClass(severity: string) {
  if (severity === "alert") {
    return "bg-[var(--line-bright)] text-[var(--ink)]";
  }

  if (severity === "watch") {
    return "bg-[rgba(15,111,136,0.1)] text-[var(--cool)]";
  }

  return "bg-[var(--line)] text-[var(--muted)]";
}

export default function NewsDesk() {
  const [news, setNews] = useState<NewsResponse>(fallbackNews);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/news");
        const payload: unknown = await response.json();

        if (isNewsResponse(payload)) {
          setNews(payload);
        }
      } catch {
        setNews(fallbackNews);
      }
    };

    load();
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <div className="space-y-4">
        {news.news.slice(0, 5).map((item) => (
          <article
            key={item.id}
            className="group rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 transition-all hover:border-[var(--line-bright)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] ${severityClass(item.severity)}`}
                >
                  {item.tag}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--dim)] opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.source}
                </span>
              </div>
              <span className="text-[9px] font-mono tabular-nums text-[var(--dim)]">
                {new Date(item.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                })}
              </span>
            </div>
            <h3 className="pt-3 text-[14px] font-bold leading-tight tracking-[-0.01em] text-[var(--ink)]">
              {item.title}
            </h3>
            <p className="pt-2 text-[12px] leading-relaxed text-[var(--muted)] line-clamp-2">
              {item.summary}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
