'use client';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function GlobalAuthLoader({ children }) {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center">
                            <Loader2 size={16} className="text-indigo-600 animate-pulse" />
                        </div>
                    </div>
                </div>
                <h2 className="mt-4 text-sm font-bold text-slate-900 uppercase tracking-widest animate-pulse">
                    Initializing Portal
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-1">Please wait...</p>
            </div>
        );
    }

    return children;
}
