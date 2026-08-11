"use client";

import { useEffect, useState, useMemo } from "react";
import { Sun, Cloud, CloudRain, Zap, Wind, Minus } from "lucide-react";

interface GlobalPoint {
  label: string;
  tz: string;
  aqi: number;
  temp?: number;
  condition?: string;
}

export default function GlobalPulse() {
  const [data, setData] = useState<GlobalPoint[]>([]);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/air-quality");
        const payload = await res.json();
        if (Array.isArray(payload)) setData(payload);
      } catch (e) {
        console.error("Pulse error:", e);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    const timeInterval = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const WeatherIcon = ({ condition }: { condition?: string }) => {
    if (!condition) return <Minus size={12} className="opacity-20" />;
    const c = condition.toLowerCase();
    if (c.includes("clear") || c.includes("sun")) return <Sun size={12} className="text-orange-400" />;
    if (c.includes("rain") || c.includes("shower")) return <CloudRain size={12} className="text-blue-400" />;
    if (c.includes("storm")) return <Zap size={12} className="text-yellow-400" />;
    if (c.includes("wind")) return <Wind size={12} className="text-teal-400" />;
    return <Cloud size={12} className="text-gray-400" />;
  };

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return "text-[var(--safe)]";
    if (aqi <= 100) return "text-[var(--hazard)]";
    return "text-[var(--accent)]";
  };

  const maxAqi = useMemo(() => {
    if (!data.length) return null;
    return [...data].sort((a, b) => b.aqi - a.aqi)[0];
  }, [data]);

  return (
    <div className="flex items-center gap-0 h-full overflow-hidden bg-white border-x border-[var(--line-dim)]">
      <div className="flex bg-black text-white h-full px-6 items-center gap-4 border-r border-black shrink-0 relative z-10">
         <div className="flex flex-col">
            <span className="text-[13px] font-black opacity-40 uppercase tracking-widest leading-none mb-1">REGION MAX AQI</span>
            <div className="flex items-center gap-3">
               <span className="text-[19px] font-black leading-none text-[var(--accent)] tabular-nums">{maxAqi?.aqi || "--"}</span>
               <span className="text-[14px] font-black uppercase opacity-60 truncate max-w-[100px]">{maxAqi?.label || "SYSTEM"}</span>
            </div>
         </div>
      </div>

      <div className="flex items-center gap-6 animate-marquee whitespace-nowrap px-6">
        {data.map((p, i) => {
          const localTime = new Intl.DateTimeFormat("en-US", {
            timeZone: p.tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(time);

          return (
            <div key={i} className="flex items-center gap-3 shrink-0 py-2">
              <div className="flex flex-col">
                <span className="text-[13px] font-black opacity-30 uppercase tracking-widest">{p.label}</span>
                <span className="text-[14px] font-black tabular-nums tracking-tighter leading-none">{localTime}</span>
              </div>
              
              <div className="h-4 w-[1px] bg-black opacity-5" />
              
              <div className="flex items-center gap-2">
                 <div className="flex flex-col items-center">
                    <span className="text-[12px] font-black opacity-20 uppercase leading-none mb-0.5">AQI</span>
                    <span className={`text-[14px] font-black tabular-nums leading-none ${getAqiColor(p.aqi)}`}>
                       {p.aqi}
                    </span>
                 </div>
                 <div className="flex flex-col items-center">
                    <WeatherIcon condition={p.condition} />
                    <span className="text-[14px] font-bold tabular-nums leading-none mt-0.5">
                       {p.temp ?? "--"}°
                    </span>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Reverse marquee for density */}
      <div className="flex items-center gap-6 animate-marquee whitespace-nowrap px-6" aria-hidden="true">
        {data.map((p, i) => {
          const localTime = new Intl.DateTimeFormat("en-US", {
            timeZone: p.tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(time);

          return (
            <div key={`dup-${i}`} className="flex items-center gap-3 shrink-0 py-2">
              <div className="flex flex-col">
                <span className="text-[12px] font-black opacity-30 uppercase tracking-widest">{p.label}</span>
                <span className="text-[13px] font-black tabular-nums tracking-tighter leading-none">{localTime}</span>
              </div>
              <div className="h-4 w-[1px] bg-black opacity-5" />
              <div className="flex items-center gap-2">
                 <div className="flex flex-col items-center">
                    <span className="text-[12px] font-black opacity-20 uppercase leading-none mb-0.5">AQI</span>
                    <span className={`text-[13px] font-black tabular-nums leading-none ${getAqiColor(p.aqi)}`}>
                       {p.aqi}
                    </span>
                 </div>
                 <div className="flex flex-col items-center">
                    <WeatherIcon condition={p.condition} />
                    <span className="text-[13px] font-bold tabular-nums leading-none mt-0.5">
                       {p.temp ?? "--"}°
                    </span>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
