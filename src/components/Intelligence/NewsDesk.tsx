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
    return "bg-[#171512] text-[#f7f2ea]";
  }

  if (severity === "watch") {
    return "bg-[#ead8ce] text-[#8b5a40]";
  }

  return "bg-[#dce7ea] text-[#4f6871]";
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
    <section className="flex h-full flex-col bg-[#f7f2ea] p-6">
      <div className="border-b border-[#d6cebf] pb-4">
        <div className="eyebrow">
          Live feed
        </div>
        <div className="pt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#171512]">
          What changed across the system
        </div>
      </div>

      <div className="space-y-5 overflow-y-auto pt-5">
        {news.news.slice(0, 5).map((item) => (
          <article
            key={item.id}
            className="rounded-[20px] border border-[#ddd5c7] bg-white/65 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-[9px] font-medium uppercase tracking-[0.18em] ${severityClass(item.severity)}`}
                >
                  {item.tag}
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#736c61]">
                  {item.source}
                </span>
              </div>
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
          </article>
        ))}
      </div>
    </section>
  );
}
