"use client";

import React from "react";

export default function FinePrint() {
  return (
    <section className="bg-white p-12 border-t-[1.5px] border-black">
      <div className="max-w-6xl mx-auto">
        <div className="eyebrow mb-8 opacity-40">Operational Governance & Multi-Regional Funding Framework</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <h4 className="text-[18px] font-black uppercase tracking-tight leading-tight">
              การพัฒนาระบบการบ่มเพาะและเร่งรัดกลุ่มเศรษฐกิจและพื้นที่อุตสาหกรรมระดับพื้นที่
            </h4>
            <div className="space-y-6 text-[12px] leading-relaxed text-[var(--muted)] text-justify">
              <p>
                โครงการวิจัยนี้ได้รับความเห็นชอบและสนับสนุนทุนจาก **หน่วยบริหารและจัดการทุนด้านการพัฒนาระดับพื้นที่ (PMU-A)** 
                ภายใต้แผนงานการยกระดับกลุ่มคลัสเตอร์เศรษฐกิจอย่างครอบคลุมและมีส่วนร่วม (Inclusive Cluster Development Program) 
                เพื่อแก้ปัญหาความเหลื่อมล้ำเชิงพื้นที่และสร้าง "จุดเติบโตใหม่" ในระดับท้องถิ่นที่ยั่งยืน
              </p>
              <p>
                ยุทธศาสตร์การขับเคลื่อนมุ่งเน้นไปยังระเบียงเศรษฐกิจพิเศษ (Special Economic Corridors) 
                ทั้งภาคตะวันออก (EEC), ภาคเหนือ (NEC), ภาคตะวันออกเฉียงเหนือ (NeEC), ภาคกลาง-ตะวันตก (CWEC) 
                และภาคใต้ (SEC) รวมถึงการพัฒนาเมืองชายแดนเพื่อกระจายความเจริญสู่พื้นที่ห่างไกล
              </p>
              <p>
                กลไกดำเนินงานแบ่งเป็น 3 ระดับ: **การสร้างฐานองค์ความรู้และเทคโนโลยี** (Body of Knowledge), 
                **การบ่มเพาะในพื้นที่ทดลอง** (Incubation Sandbox) ครอบคลุมอุตสาหกรรม 8 กลุ่มศักยภาพ 
                และ **การเร่งรัดการเติบโต** (Accelerator Sandbox) เพื่อผลักดัน "Champion Products" และกองทุนผลกระทบทางสังคม (Impact Fund)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
             <div className="border-l-[2px] border-black pl-6">
                <div className="eyebrow scale-75 origin-left opacity-30">Strategic Direction</div>
                <div className="text-[13px] font-black uppercase mt-1">Assoc. Prof. Dr. Poon Thiayaboonnatham</div>
                <div className="text-[10px] text-[var(--dim)] mt-1 uppercase tracking-widest font-bold">Scientific Lead // Thatchaphum</div>
             </div>
             <div className="border-l-[2px] border-black pl-6">
                <div className="eyebrow scale-75 origin-left opacity-30">Operational Units</div>
                <div className="text-[13px] font-black uppercase mt-1">20 Industrial Clusters</div>
                <div className="text-[10px] text-[var(--dim)] mt-1 uppercase tracking-widest font-bold">AI, EV, Biochar, Coffee, etc.</div>
             </div>
             <div className="border-l-[2px] border-black pl-6">
                <div className="eyebrow scale-75 origin-left opacity-30">Framework Compliance</div>
                <div className="text-[13px] font-black uppercase mt-1">Governance Standard</div>
                <div className="text-[10px] text-[var(--dim)] mt-1 uppercase tracking-widest font-bold">ESG Monitoring // Sustainable growth</div>
             </div>
             <div className="border-l-[2px] border-black pl-6">
                <div className="eyebrow scale-75 origin-left opacity-30">Research Impact</div>
                <div className="text-[13px] font-black uppercase mt-1">Local Growth Nodes</div>
                <div className="text-[10px] text-[var(--dim)] mt-1 uppercase tracking-widest font-bold">Inclusive Development // PMU-A</div>
             </div>
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-black border-dotted">
           <div className="flex items-center justify-between mb-6">
              <div className="eyebrow opacity-30">Active Operational Clusters (20 Total)</div>
              <div className="text-[9px] font-black opacity-20 uppercase tracking-[0.3em]">Status: Active Deployment</div>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2">
              {[
                "AI/Robotics", "Bamboo", "Biochar", "Cocoa", "Coffee", 
                "Durian", "EV-Local", "Cosmetics", "Timber", "Insects",
                "Startups", "SMEs", "Logistics", "Green Tech", "Digital",
                "Tourism", "Healthcare", "Education", "Agri-Tech", "Water-Tech"
              ].map(tag => (
                <span key={tag} className="text-[8px] font-black opacity-30 uppercase tracking-widest text-center py-2 border border-black/10 hover:opacity-100 hover:border-black transition-all bg-[var(--bg)] cursor-default">
                   {tag}
                </span>
              ))}
           </div>
        </div>

        <div className="mt-12 text-center">
           <p className="text-[9px] font-black opacity-20 uppercase tracking-[0.5em]">
              Precision Tactical Dashboard // Strategic Command Center // Version 2.0.0 (Hardened)
           </p>
        </div>
      </div>
    </section>
  );
}
