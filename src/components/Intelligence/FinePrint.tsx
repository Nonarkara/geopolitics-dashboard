"use client";

import React from "react";

export default function FinePrint() {
  return (
    <section className="bg-white p-8 border-t-[1.5px] border-black">
      <div className="max-w-6xl mx-auto">
        <div className="eyebrow mb-6 opacity-40">Project Governance & Funding Framework</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h4 className="text-[16px] font-black uppercase tracking-tight leading-tight">
              การพัฒนาระบบการบ่มเพาะและเร่งรัดกลุ่มเศรษฐกิจและพื้นที่อุตสาหกรรมระดับพื้นที่
            </h4>
            <div className="space-y-4 text-[11px] leading-relaxed text-[var(--muted)] text-justify">
              <p>
                โครงการนี้ได้รับการสนับสนุนทุนวิจัยจาก **หน่วยบริหารและจัดการทุนด้านการพัฒนาระดับพื้นที่ (PMU-A)** 
                ภายใต้กรอบแนวคิดการยกระดับกลุ่มคลัสเตอร์เศรษฐกิจอย่างครอบคลุมและมีส่วนร่วม (Inclusive Cluster Development Program) 
                เพื่อลดความเหลื่อมล้ำเชิงพื้นที่และสร้างจุดเติบโตใหม่ในระดับท้องถิ่น
              </p>
              <p>
                โดยมุ่งเน้นการพัฒนาระเบียงเศรษฐกิจพิเศษในหลายภูมิภาค (EEC, NEC, NeEC, CWEC, SEC) 
                ผ่านกระบวนการ 3 ระดับ: การสร้างฐานองค์ความรู้, การบ่มเพาะใน Sandbox และการเร่งรัดการเติบโต (Accelerator) 
                เพื่อเสริมสร้างขีดความสามารถของ SMEs และ Startups ใน 20 กลุ่มคลัสเตอร์อุตสาหกรรมเป้าหมาย
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="border-l-[1.5px] border-black pl-5">
                <div className="eyebrow scale-75 origin-left opacity-30">Scientific Direction</div>
                <div className="text-[11px] font-black uppercase mt-1">Assoc. Prof. Dr. Poon Thiayaboonnatham</div>
                <div className="text-[9px] text-[var(--dim)] mt-1 uppercase tracking-widest font-bold">Research lead // Thatchaphum</div>
             </div>
             <div className="border-l-[1.5px] border-black pl-5">
                <div className="eyebrow scale-75 origin-left opacity-30">Operational Scale</div>
                <div className="text-[11px] font-black uppercase mt-1">20 Industrial Clusters</div>
                <div className="text-[9px] text-[var(--dim)] mt-1 uppercase tracking-widest font-bold">AI, EV, Agriculture, Biochar</div>
             </div>
             <div className="border-l-[1.5px] border-black pl-5">
                <div className="eyebrow scale-75 origin-left opacity-30">Strategic Corridors</div>
                <div className="text-[11px] font-black uppercase mt-1">EEC / SEC / CWEC / NEC</div>
                <div className="text-[9px] text-[var(--dim)] mt-1 uppercase tracking-widest font-bold">Regional Development Focus</div>
             </div>
             <div className="border-l-[1.5px] border-black pl-5">
                <div className="eyebrow scale-75 origin-left opacity-30">Data Accuracy</div>
                <div className="text-[11px] font-black uppercase mt-1">Verified Signals Only</div>
                <div className="text-[9px] text-[var(--dim)] mt-1 uppercase tracking-widest font-bold">RT Satellite Correlation</div>
             </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--line-dim)] border-dotted">
           <div className="eyebrow mb-4 opacity-30">Priority Clusters</div>
           <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
              {[
                "AI/Robotics", "Bamboo", "Biochar", "Cocoa", "Coffee", 
                "Durian", "EV-Local", "Cosmetics", "Timber", "Insects",
                "Startups", "SMEs", "Logistics", "Green Tech", "Digital",
                "Tourism", "Healthcare", "Education", "Agri-Tech", "Water-Tech"
              ].map(tag => (
                <span key={tag} className="text-[8px] font-black opacity-30 uppercase tracking-widest text-center py-1.5 border border-[var(--line-dim)] hover:opacity-100 transition-opacity bg-[var(--bg)] cursor-default">
                   {tag}
                </span>
              ))}
           </div>
        </div>
      </div>
    </section>
  );
}
