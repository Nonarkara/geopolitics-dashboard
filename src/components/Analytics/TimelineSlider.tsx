import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';

interface TimelineSliderProps {
    onTimeChange?: (step: number) => void;
}

export default function TimelineSlider({ onTimeChange }: TimelineSliderProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(100); // 0 to 100 percentage
    const dates = ['2000', '2010', '2020', '2025', 'NOW'];

    useEffect(() => {
        let interval: ReturnType<typeof window.setInterval> | undefined;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentStep(prev => (prev < 100 ? prev + 1 : 0));
            }, 200);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    useEffect(() => {
        onTimeChange?.(currentStep);
    }, [currentStep, onTimeChange]);

    return (
        <div className="bg-[#0c0c0c] p-6 flex items-center gap-10 select-none border-none shadow-2xl">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`w-10 h-10 flex items-center justify-center transition-all ${isPlaying ? 'bg-[#ff4d00] text-white' : 'bg-[#1a1a1a] text-[#7a7a7a] hover:bg-[#222]'}`}
                >
                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                </button>
            </div>

            <div className="flex-1 space-y-4">
                <div className="flex justify-between text-[10px] font-black text-[#333] uppercase tracking-[0.25em]">
                    {dates.map((d, i) => (
                        <span key={i} className={currentStep >= (i * 25) ? 'text-[#e5e5e5]' : ''}>{d}</span>
                    ))}
                </div>
                <div className="relative pt-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentStep}
                        onChange={(e) => setCurrentStep(parseInt(e.target.value))}
                        className="w-full h-[2px] bg-[#1a1a1a] appearance-none cursor-pointer accent-[#ff4d00]"
                    />
                </div>
            </div>

            <div className="flex flex-col items-end gap-1 px-8 min-w-[120px]">
                <span className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em]">TEMPORAL_NODE</span>
                <span className="text-[14px] font-bold text-[#e5e5e5] tabular-nums tracking-tighter">
                    {Math.floor(2000 + (currentStep / 100) * 26)}.Q{Math.ceil(((currentStep % 25) / 25) * 4) || 1}
                </span>
            </div>
        </div>
    );
}
