import Link from 'next/link';
import { Calendar, Clock, ArrowRight, Users, GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/utils/config';

export default function PublishedExams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/exams/live`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const contentType = res.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new TypeError("Oops, we didn't get JSON!");
                }
                return res.json();
            })
            .then(data => {
                setExams(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch exams", err);
                setExams([]);
                setLoading(false);
            });
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-emerald-500 animate-spin"></div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Schedule...</p>
        </div>
    );

    if (exams.length === 0) return (
        <div className="text-center py-16 px-6 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Calendar size={32} />
            </div>
            <p className="font-black text-xl text-slate-300 uppercase tracking-widest">
                No active sessions
            </p>
            <p className="text-slate-400 text-sm mt-2 font-medium">There are no exams scheduled for today or upcoming.</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {exams.map((exam, idx) => {
                    const isLive = new Date(exam.date).toDateString() === new Date().toDateString();
                    return (
                        <Link
                            key={exam.id}
                            href={`/student?exam=${encodeURIComponent(exam.name)}&date=${exam.date}`}
                            className="group relative flex flex-row bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border border-slate-100 w-full h-80"
                        >
                            {/* Decorative Gradient Line & Status Badges */}
                            <div className={`absolute top-0 left-0 w-1.5 h-full z-20 ${isLive ? 'bg-emerald-500' : 'bg-slate-200 group-hover:bg-emerald-400 transition-colors'}`}></div>

                            {!isLive && (
                                <div className="absolute top-6 right-6 z-10">
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-slate-100">
                                        Upcoming
                                    </span>
                                </div>
                            )}

                            {/* Date Section */}
                            <div className={`w-32 sm:w-44 flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-100 p-4 relative transition-colors ${isLive ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
                                <div className="flex flex-col items-center z-10">
                                    <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isLive ? 'text-emerald-400' : 'text-slate-400'}`}>
                                        {new Date(exam.date).toLocaleDateString(undefined, { month: 'short' })}
                                    </span>
                                    <span className="text-4xl sm:text-5xl font-black leading-none tracking-tight">
                                        {new Date(exam.date).getDate()}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase mt-1 ${isLive ? 'opacity-60' : 'text-slate-400'}`}>
                                        {new Date(exam.date).getFullYear()}
                                    </span>
                                </div>

                                <div className="my-4 w-8 h-0.5 bg-current opacity-20"></div>

                                <div className="text-center z-10">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${isLive ? 'bg-white/10 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                                        <Clock size={10} />
                                        {exam.time.split('-')[0].trim()}
                                    </span>
                                </div>

                                {isLive && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider rounded-sm animate-pulse shadow-lg shadow-emerald-500/20">
                                        LIVE
                                    </div>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between min-w-0">
                                <div className="pr-20"> {/* Right padding for badge space */}
                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors line-clamp-2 mb-3">
                                        {exam.name}
                                    </h3>
                                    <div className="space-y-3 mb-4">
                                        {/* Branch/Batch */}
                                        <div className="flex items-start gap-3 text-sm text-slate-600">
                                            <div className="mt-0.5 p-1.5 rounded-md bg-indigo-50 text-indigo-600 shrink-0">
                                                <Users size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch / Branch</span>
                                                <span className="font-semibold text-slate-800 leading-tight line-clamp-2">
                                                    {exam.branch || 'All Branches'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Year & Academic Year Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Year */}
                                            {exam.year && (
                                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                                    <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 shrink-0">
                                                        <GraduationCap size={14} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year</span>
                                                        <span className="font-semibold text-slate-800">{exam.year}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Academic Year */}
                                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                                <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 shrink-0">
                                                    <Calendar size={14} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Year</span>
                                                    <span className="font-semibold text-slate-800">{exam.academicYear || new Date(exam.date).getFullYear()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`w-7 h-7 rounded-full border-2 border-white bg-slate-${i * 100} flex items-center justify-center text-[9px] text-slate-500 font-bold`}>
                                                <Users size={12} className="opacity-50" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all">
                                        Hall Allocation <ArrowRight size={14} />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

function Badge({ text }) {
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide truncate max-w-[120px]">
            {text}
        </span>
    );
}
