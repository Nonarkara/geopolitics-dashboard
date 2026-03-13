"use client";

import React from "react";

export default function FinePrint() {
  return (
    <section className="bg-white p-6 border-t-[1.5px] border-[var(--line)]">
      <div className="max-w-6xl mx-auto">
        <div className="eyebrow mb-4 opacity-40">Project Governance & Funding</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <h4 className="text-[14px] font-black uppercase tracking-tight leading-tight">
              การพัฒนาระบบการบ่มเพาะและเร่งรัดกลุ่มเศรษฐกิจและพื้นที่อุตสาหกรรมระดับพื้นที่
            </h4>
            <p className="text-[11px] leading-relaxed text-[var(--muted)] text-justify">
              โครงการนี้ได้รับการสนับสนุนทุนวิจัยจาก **หน่วยบริหารและจัดการทุนด้านการพัฒนาระดับพื้นที่ (PMU-A)** 
              โดยมีเป้าหมายเพื่อเป็นกลไกสําคัญในการลดความเหลื่อมลํ้าทางเศรษฐกิจและสร้าง “จุดเติบโตใหม่” ในระดับท้องถิ่น 
              ผ่านการพัฒนาระเบียงเศรษฐกิจพิเศษ (EEC, NEC, NeEC, CWEC, SEC) และการยกระดับกลุ่มคลัสเตอร์เศรษฐกิจอย่างครอบคลุม
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="border-l-[1.5px] border-[var(--line)] pl-4">
                <div className="eyebrow scale-75 origin-left opacity-30">Strategic Framework</div>
                <div className="text-[10px] font-black uppercase mt-1">Inclusive Cluster Development</div>
                <div className="text-[9px] text-[var(--dim)] mt-1">By Assoc. Prof. Dr. Poon Thiayaboonnatham</div>
             </div>
             <div className="border-l-[1.5px] border-[var(--line)] pl-4">
                <div className="eyebrow scale-75 origin-left opacity-30">Operational Units</div>
                <div className="text-[10px] font-black uppercase mt-1">20 Industrial Clusters</div>
                <div className="text-[9px] text-[var(--dim)] mt-1">AI, Agriculture, EVs, Tourism, etc.</div>
             </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--line-dim)] border-dotted grid grid-cols-3 md:grid-cols-6 gap-2">
           {[
             "AI/Robotics", "High-Value Ag", "Green Economy", "Deep Tech", "Cross-Border Trade",
             "Health Economy", "Educational Tech", "Bamboo Cluster", "EV-Local", "Biochar"
           ].map(tag => (
             <span key={tag} className="text-[8px] font-black opacity-30 uppercase tracking-widest text-center py-1 border border-[var(--line-dim)]">
                {tag}
             </span>
           ))}
        </div>
      </div>
    </section>
  );
}
