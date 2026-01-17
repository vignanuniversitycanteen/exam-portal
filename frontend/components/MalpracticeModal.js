'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, X, Save, FileWarning, Loader2, MapPin, Hash, CheckCircle, Search, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VisualRoomLayout from './VisualRoomLayout';
import { API_BASE_URL } from '@/utils/config';

export default function MalpracticeModal({ exam, exams = [], onClose, editingEntry = null }) {
    const [formData, setFormData] = useState({
        student_reg: editingEntry?.student_reg || '',
        exam_id: editingEntry?.exam_id || exam?.id || '',
        reason: editingEntry?.reason || '',
        severity: editingEntry?.severity || 'Medium',
        action_taken: editingEntry?.action_taken || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Seat Lookup State
    const [seatInfo, setSeatInfo] = useState(null);
    const [searchingSeat, setSearchingSeat] = useState(false);
    const [layout, setLayout] = useState(null);
    const [loadingLayout, setLoadingLayout] = useState(false);

    // Auto Seat Lookup
    useEffect(() => {
        const lookupSeat = async () => {
            const cleanReg = formData.student_reg.trim();
            if (cleanReg.length < 5 || !exam?.id) {
                setSeatInfo(null);
                setLayout(null);
                return;
            }

            setSearchingSeat(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/seating/lookup?reg=${encodeURIComponent(cleanReg)}&exam_id=${exam.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setSeatInfo(data);
                    fetchLayout(data);
                } else {
                    setSeatInfo(null);
                    setLayout(null);
                }
            } catch (err) {
                console.error('Seat lookup failed', err);
            } finally {
                setSearchingSeat(false);
            }
        };

        const timer = setTimeout(lookupSeat, 600);
        return () => clearTimeout(timer);
    }, [formData.student_reg, exam?.id]);

    const fetchLayout = async (seat) => {
        if (!exam?.id) return;
        setLoadingLayout(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/exams/${exam.id}/rooms/${encodeURIComponent(seat.room_name)}/layout`);
            if (res.ok) {
                const data = await res.json();
                setLayout(data);
            }
        } catch (err) {
            console.error('Layout fetch failed', err);
        } finally {
            setLoadingLayout(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const url = editingEntry
                ? `${API_BASE_URL}/api/malpractice/${editingEntry.id}`
                : `${API_BASE_URL}/api/malpractice`;

            const method = editingEntry ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    student_reg: formData.student_reg.trim(),
                    exam_id: formData.exam_id,
                    reason: formData.reason,
                    severity: formData.severity,
                    action_taken: formData.action_taken
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                setError(data.error || 'Failed to submit entry');
            }
        } catch (err) {
            setError('Server Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative border border-slate-200"
            >
                {/* Header - Orange Gradient with Diagonal Stripes */}
                <div className="relative bg-orange-500 p-8 border-b border-orange-400/20 flex justify-between items-center overflow-hidden">
                    {/* High-Contrast Diagonal Stripes Overlay */}
                    <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.4) 10px, rgba(255,255,255,0.4) 20px)',
                            backgroundSize: '28px 28px'
                        }}
                    ></div>

                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-[1.2rem] backdrop-blur-md border border-white/30 shadow-inner">
                            <AlertTriangle className="text-white" size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-tight leading-none">
                                Malpractice Registry
                            </h2>
                            <p className="text-orange-100 text-[10px] font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                                {exam ? exam.name : 'Registry Protocol'} <span className="w-1.5 h-1.5 rounded-full bg-orange-300"></span> T4
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/60 hover:text-white transition p-3 hover:bg-white/10 rounded-2xl relative z-10">
                        <X size={28} />
                    </button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto custom-scrollbar p-6 md:p-8 bg-slate-50/30">
                    {!exam ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                            <div className="p-6 bg-orange-100 rounded-full text-orange-600 shadow-inner">
                                <Search size={48} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Active Context Missing</h3>
                                <p className="text-slate-500 font-bold max-w-xs mx-auto text-sm">
                                    Please select a specific exam from the registry filter before creating a new malpractice record.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all"
                            >
                                Return to Registry
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-xs font-black flex items-center gap-3 border border-rose-100">
                                    <FileWarning size={18} /> {error}
                                </motion.div>
                            )}

                            {/* Layout Grid: Structured Columns */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column: ID Input and State Card */}
                                <div className="space-y-6">
                                    <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-200/60 relative group transition-all hover:shadow-md">
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Target Registration</label>
                                        <div className="relative">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                                            <input
                                                required
                                                className="w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl pl-14 pr-4 py-4.5 outline-none focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 font-bold text-slate-700 transition tracking-widest placeholder:text-slate-300 uppercase text-sm"
                                                placeholder="E.G. 20L31A0501"
                                                value={formData.student_reg}
                                                onChange={e => setFormData({ ...formData, student_reg: e.target.value.toUpperCase() })}
                                            />
                                            {searchingSeat && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-orange-500" size={20} />}
                                        </div>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {seatInfo ? (
                                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[80px] group-hover:bg-orange-500/20 transition-all duration-1000"></div>
                                                <div className="flex items-center gap-4 mb-8 relative z-10">
                                                    <div className="w-12 h-12 bg-orange-500 text-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                                        <MapPin size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400 mb-1">Student Located</p>
                                                        <p className="text-xl font-black tracking-tight leading-none uppercase">{seatInfo.room_name}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 relative z-10">
                                                    <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Coordinate</p>
                                                        <p className="text-2xl font-black text-white">{String.fromCharCode(64 + seatInfo.row)}-{seatInfo.col}</p>
                                                    </div>
                                                    <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex flex-col justify-end">
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Reg. Index</p>
                                                        <p className="text-2xl font-black text-orange-400">{formData.student_reg.slice(-4)}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center space-y-5 transition-colors hover:border-orange-200">
                                                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center shadow-inner">
                                                    <Search size={36} className="text-slate-200" />
                                                </div>
                                                <div>
                                                    <p className="font-black uppercase tracking-[0.2em] text-slate-500 text-[11px] mb-2 leading-none">Waiting for Input</p>
                                                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                                                        Provide student registration number to auto-locate.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Right Column: Visual Mapping Section */}
                                <div className="bg-white p-7 rounded-[3rem] shadow-sm border border-slate-200/60 flex flex-col">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                                <MapPin size={20} />
                                            </div>
                                            <span className="text-sm font-black text-slate-800 uppercase tracking-[0.1em]">Real-time Visual Map</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                                            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Interactive Mode</span>
                                        </div>
                                    </div>

                                    <div className="flex-grow flex items-center justify-center min-h-[320px] bg-slate-50/50 rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
                                        <AnimatePresence mode="wait">
                                            {loadingLayout ? (
                                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                                                    <Loader2 className="animate-spin text-orange-500" size={32} />
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Architectural Discovery...</span>
                                                </motion.div>
                                            ) : layout && seatInfo ? (
                                                <motion.div key="map" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                                                    <VisualRoomLayout layout={layout} targetSeat={seatInfo} />
                                                </motion.div>
                                            ) : (
                                                <div key="placeholder" className="flex flex-col items-center text-center space-y-5 px-8">
                                                    <div className="w-24 h-24 rounded-[3rem] bg-white border border-slate-100 flex items-center justify-center text-slate-100 shadow-sm">
                                                        <Hash size={44} className="opacity-10" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Visualization Restricted</p>
                                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Input Reg No to Reveal Map</p>
                                                    </div>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Section: Details and Actions */}
                            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200/60 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Malpractice Details</label>
                                            <span className="h-px bg-slate-100 flex-grow ml-4"></span>
                                        </div>
                                        <textarea
                                            required
                                            rows="4"
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-sm font-bold text-slate-700 transition resize-none placeholder:text-slate-300"
                                            placeholder="Clearly describe the incident, including evidence found (e.g., hidden slips, mobile phone)..."
                                            value={formData.reason}
                                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Action Implemented</label>
                                                <span className="h-px bg-slate-100 flex-grow ml-4"></span>
                                            </div>
                                            <input
                                                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4.5 outline-none focus:bg-white focus:border-orange-500 font-bold text-sm text-slate-700 transition placeholder:text-slate-300"
                                                placeholder="e.g. Confiscated material, Warning Issued"
                                                value={formData.action_taken}
                                                onChange={e => setFormData({ ...formData, action_taken: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Severity Classification</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['Low', 'Medium', 'High'].map(level => (
                                                    <button
                                                        key={level}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, severity: level })}
                                                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.severity === level
                                                            ? (level === 'High' ? 'bg-orange-600 border-orange-600 text-white shadow-xl shadow-orange-200' : 'bg-slate-900 border-slate-900 text-white shadow-xl')
                                                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                            }`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submission Footer */}
                            <div className="pt-4 px-2 md:px-0">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-[3rem] transition-all shadow-2xl flex items-center justify-center gap-4 text-lg font-black uppercase tracking-tighter active:scale-[0.98] disabled:opacity-50 group overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-orange-500/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                                    <div className="p-1 px-3 bg-orange-500 rounded-lg text-slate-900 relative z-10">
                                        <Save size={22} strokeWidth={3} />
                                    </div>
                                    <span className="relative z-10">
                                        {loading ? 'Processing Registry...' : 'Commit Incident Report'}
                                    </span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// Custom CSS (Injected or assumes Tailwind and Framer Motion)
// In a real project, shimmers and scrollbars are in global.css
