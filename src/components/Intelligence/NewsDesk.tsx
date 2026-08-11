"use client";

import { useEffect, useState } from "react";
import type { NewsResponse } from "../../types/dashboard";

const emptyNews: NewsResponse = { news: [], generatedAt: "" };

function isNewsResponse(value: unknown): value is NewsResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "news" in value &&
    Array.isArray(value.news)
  );
}

export default function NewsDesk() {
  const [news, setNews] = useState<NewsResponse>(emptyNews);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/news");
        const payload: unknown = await response.json();
        if (isNewsResponse(payload)) {
          setNews(payload);
        }
      } catch {
        // Fail closed: keep whatever honest state we already have.
      }
    };

    load();
    const poll = setInterval(load, 20000); // 20s Polling for Real-Time feel
    return () => clearInterval(poll);
  }, []);

  if (news.news.length === 0) {
    return (
      <div className="border border-[var(--line-dim)] border-dashed p-3 text-center text-[9px] font-black uppercase tracking-widest text-[var(--dim)]">
        Live feed unavailable
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {news.news.slice(0, 5).map((item) => (
        <article
          key={item.id}
          className="ops-card group flex flex-col gap-1 hover:border-[var(--ink)]"
        >
          <div className="flex items-center justify-between">
            <div className={`text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest ${item.severity === 'alert' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--line-dim)] text-[var(--ink)]'}`}>
              Signal {item.tag}
            </div>
            <span className="text-[8px] font-black tabular-nums opacity-30">
              {new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h3 className="text-[13px] font-black uppercase leading-[1.2] tracking-tight group-hover:text-[var(--accent)] transition-colors">
            {item.title}
          </h3>
          <p className="text-[10px] font-medium leading-tight text-[var(--dim)] line-clamp-2">
            {item.summary}
          </p>
          <div className="flex items-center justify-between mt-1 pt-1 border-t border-[var(--line-dim)] border-dotted">
             <span className="text-[7px] font-black opacity-30 uppercase">{item.source}</span>
             <span className="text-[7px] font-black text-[var(--tech)] uppercase">Verified</span>
          </div>
        </article>
      ))}
    </div>
  );
}
