"use client";

import React from "react";

export default function FinePrint() {
  return (
    <section className="bg-[var(--bg)] p-4 border-t border-black shrink-0 relative z-40 max-h-[140px] overflow-hidden hover:max-h-none transition-all duration-500 group">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-start gap-8">
          
          {/* Main Description (Condensed) */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-black uppercase tracking-tight leading-none mb-1.5 flex items-center gap-2">
              <span className="w-1 h-3 bg-[var(--accent)]" />
              การพัฒนระบบการบ่มเพาะและเร่งรัดกลุ่มเศรษฐกิจระดับพื้นที่ (PMU-A)
            </h4>
            <div className="text-[9px] leading-tight text-[var(--muted)] line-clamp-2 group-hover:line-clamp-none transition-all">
              โครงการภายใต้หน่วยบริหารและจัดการทุนด้านการพัฒนาระดับพื้นที่ (PMU-A) 
              แผนงาน Inclusive Cluster Development เพื่อแก้ปัญหาความเหลื่อมล้ำเชิงพื้นที่และสร้างจุดเติบโตใหม่
              ครอบคลุม 5 ระเบียงเศรษฐกิจพิเศษ (EEC, NEC, NeEC, CWEC, SEC) และเมืองชายแดน 
              ผ่านกลไก 3 ระดับ: Knowledge Base, Incubation Sandbox (8 อุตสาหกรรม) และ Accelerator Sandbox.
            </div>
          </div>

          {/* Leaders & Units */}
          <div className="flex gap-4 shrink-0">
             <div className="border-l border-black/20 pl-3">
                <div className="text-[7px] font-black opacity-30 uppercase">Scientific Lead</div>
                <div className="text-[10px] font-black uppercase whitespace-nowrap">Assoc. Prof. Dr. Poon T.</div>
             </div>
             <div className="border-l border-black/20 pl-3">
                <div className="text-[7px] font-black opacity-30 uppercase">Clusters</div>
                <div className="text-[10px] font-black uppercase whitespace-nowrap">20 Industrial Units</div>
             </div>
          </div>

          {/* Tags (Ultra Compact) */}
          <div className="w-[300px] shrink-0 border-l border-black/20 pl-3 hidden lg:block">
            <div className="flex flex-wrap gap-1">
               {["AI", "EV", "Biochar", "Cocoa", "Coffee", "Durian", "Cosmetics", "Timber", "Insects", "SMEs"].map(tag => (
                 <span key={tag} className="text-[7px] font-black opacity-20 uppercase px-1 border border-black/5">{tag}</span>
               ))}
            </div>
            <div className="text-[7px] font-black opacity-10 uppercase mt-1">Status: Active Deployment // Connected Grid V5</div>
          </div>
        </div>
      </div>
    </section>
  );
}
