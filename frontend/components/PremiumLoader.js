'use client';
import { Loader2 } from 'lucide-react';

export default function PremiumLoader({ text = "Loading", subText = "Please Wait" }) {
    return (
        <div className="fixed inset-0 bg-white/80 z-[9999] flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-slate-800">{text}</h2>
            <p className="text-slate-500 text-sm mt-1">{subText}</p>
        </div>
    );
}
