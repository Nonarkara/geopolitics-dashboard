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
    return "bg-[#121212] text-[#ece6db]";
  }

  if (severity === "watch") {
    return "bg-[#bfa36e] text-[#121212]";
  }

  return "bg-[#d9d2c4] text-[#3f3b34]";
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
    <section className="flex h-full flex-col border-b border-[#cfc7b7] bg-[#f4efe7] p-6">
      <div className="border-b border-[#cfc7b7] pb-4">
        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#787267]">
          News Desk
        </div>
        <div className="pt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#121212]">
          Field and market headlines
        </div>
      </div>

      <div className="space-y-5 overflow-y-auto pt-5">
        {news.news.slice(0, 5).map((item) => (
          <article key={item.id} className="border-b border-[#ddd5c7] pb-5 last:border-b-0">
            <div className="flex items-center justify-between gap-4">
              <span className={`px-2 py-1 text-[9px] font-medium uppercase tracking-[0.18em] ${severityClass(item.severity)}`}>
                {item.tag}
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#7a7468]">
                {new Date(item.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                })}
              </span>
            </div>
            <h3 className="pt-3 text-[16px] font-semibold leading-6 text-[#151515]">
              {item.title}
            </h3>
            <p className="pt-2 text-[13px] leading-6 text-[#4e4a42]">
              {item.summary}
            </p>
            <div className="pt-3 text-[10px] uppercase tracking-[0.18em] text-[#7a7468]">
              {item.source}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
