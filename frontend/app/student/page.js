'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import PremiumLoader from '../../components/PremiumLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Clock, BookOpen, GraduationCap, Loader2, AlertCircle, CheckCircle, Info, Sparkles, ChevronRight, UserCircle, Users, Hash, ShieldCheck, Printer, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

function StudentContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const examParam = searchParams.get('exam');
    const dateParam = searchParams.get('date');
    const [formData, setFormData] = useState({ regNo: '', branch: '', year: '' });
    const [branchOptions, setBranchOptions] = useState([]);
    const [results, setResults] = useState(null);
    const [isSummary, setIsSummary] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [pendingData, setPendingData] = useState(null);

    // Effect to prefill and check profile
    // Effect to prefill and check profile
    useEffect(() => {
        if (!authLoading && user) {
            // Strict Check: If ANY essential data is missing, redirect.
            // This catches stale localStorage where is_profile_complete might be true but data is empty.
            const hasData = user.branch && user.academic_start && user.branch !== '-' && user.academic_start > 0;
            const isComplete = user.is_profile_complete && hasData;

            if (!isComplete) {
                router.push('/student/complete-profile');
            }
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && user.is_profile_complete) {
            setFormData(prev => ({
                ...prev,
                regNo: user.reg_no || prev.regNo,
                year: user.current_year || prev.year
            }));
        }
    }, [user]);

    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/branches')
            .then(res => res.json())
            .then(data => {
                const unique = Array.from(new Set([...['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'AI&DS', 'EEE', 'BIOTECH', 'CHEM'], ...data]));
                setBranchOptions(unique.sort());
            })
            .catch(err => console.error("Failed to fetch branches", err));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newValue = (name === 'regNo' || name === 'branch') ? value.toUpperCase() : value;
        setFormData({ ...formData, [name]: newValue });
    };

    const fetchSeating = async (isPolling = false) => {
        if (!formData.regNo || !formData.branch || !formData.year) {
            if (!isPolling) setError("Please enter Registration Number, Branch, and Year.");
            return;
        }

        if (!isPolling) {
            setLoading(true);
            setError('');
            setResults(null);
            setIsSummary(false);
        }

        try {
            let url;
            let isSummaryMode = false;

            if (formData.regNo) {
                const query = new URLSearchParams({
                    reg_no: formData.regNo,
                    branch: formData.branch,
                    year: formData.year
                }).toString();
                url = `http://127.0.0.1:5000/api/seating?${query}`;
            } else {
                const query = new URLSearchParams({
                    branch: formData.branch,
                    year: formData.year
                }).toString();
                url = `http://127.0.0.1:5000/api/seating/summary?${query}`;
                isSummaryMode = true;
            }

            const res = await fetch(url, { cache: 'no-store' });
            const data = await res.json();

            if (res.ok && data.length > 0) {
                let finalResults = data;
                if (!isSummaryMode && examParam) {
                    finalResults = data.filter(r => r.Exam?.name === examParam);
                    if (finalResults.length === 0 && data.length > 0) {
                        if (!isPolling) setError(`No seating found for ${examParam} matching your details.`);
                        if (!isPolling) setResults(null);
                        return;
                    }
                }
                // INTERCEPT: Show Instructions First if not polling
                if (!isPolling) {
                    setPendingData({ results: finalResults, isSummary: isSummaryMode });
                    setShowInstructions(true);
                } else {
                    // If polling (already verified), just update
                    setResults(finalResults);
                    setIsSummary(isSummaryMode);
                }

                // if (!isPolling) setTimeout(() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
            } else {
                if (!isPolling) setError(data.error || (isSummaryMode ? 'No exams found for this branch.' : 'No allocation found. Please verify your registration number & try again.'));
            }
        } catch (err) {
            console.error('Search Error:', err);
            if (!isPolling) setError(`Connection failed: ${err.message}. Is backend running?`);
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        fetchSeating(false);
    };

    const confirmInstructions = () => {
        if (pendingData) {
            setResults(pendingData.results);
            setIsSummary(pendingData.isSummary);
            setShowInstructions(false);
            setPendingData(null);

            // Scroll to results
            setTimeout(() => {
                document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    useEffect(() => {
        let interval;
        if (results && !isSummary) {
            interval = setInterval(() => fetchSeating(true), 10000);
        }
        return () => clearInterval(interval);
    }, [results, isSummary, formData]);


    if (authLoading) return <PremiumLoader text="Verifying Session" subText="Identity check in progress..." />;

    if (!user) {
        return (
            <div className="min-h-screen bg-white font-sans flex flex-col">
                <Navbar />
                <div className="flex-grow flex flex-col lg:flex-row">
                    {/* Left: Content Section */}
                    <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[#FAFAFA] -z-10" />

                        <div className="max-w-lg w-full z-10">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-rose-600 text-[10px] font-black uppercase tracking-widest mb-6">
                                    <Lock size={12} />
                                    <span>Authentication Required</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tighter">
                                    Live Seat <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">Restricted Access</span>
                                </h1>
                                <p className="text-lg text-slate-500 font-medium mb-8 leading-relaxed max-w-md">
                                    To protect student privacy and ensure exam integrity, real-time seating allocations are visible only to verified accounts.
                                </p>

                                <div className="space-y-4">
                                    <Link
                                        href="/student/login"
                                        className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Student Login
                                        <ArrowRight size={18} />
                                    </Link>

                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 pt-4">
                                        <div className="flex -space-x-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white" />
                                            <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white" />
                                            <div className="w-8 h-8 rounded-full bg-slate-400 border-2 border-white flex items-center justify-center text-[8px] text-white">4k+</div>
                                        </div>
                                        <p>Students Active Now</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Background Decor */}
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-rose-500/10 to-orange-500/10 blur-3xl rounded-full pointer-events-none" />
                    </div>

                    {/* Right: Visual Section (Hidden on Mobile, Visible on Desktop) */}
                    <div className="hidden lg:flex flex-1 bg-slate-900 relative items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 to-transparent z-10" />

                        {/* Abstract Visual Representation of Seating */}
                        <div className="relative z-0 grid grid-cols-6 gap-3 transform -rotate-12 scale-110 opacity-40">
                            {Array.from({ length: 24 }).map((_, i) => (
                                <div key={i} className={`w-16 h-16 rounded-xl border border-white/10 ${i === 14 ? 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)] border-emerald-400' : 'bg-white/5'}`}></div>
                            ))}
                        </div>

                        <div className="absolute z-20 text-center p-10">
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-2xl">
                                <ShieldCheck className="text-emerald-400" size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Verified Access Only</h3>
                            <p className="text-slate-400 text-sm font-medium">Please authenticate to view your exam hall ticket.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // NEW: Strict guard to prevent UI flash for incomplete profiles
    // NEW: Strict guard to prevent UI flash for incomplete profiles
    const strictHasData = user?.branch && user?.academic_start && user?.branch !== '-' && user?.academic_start > 0;
    const strictIsComplete = user?.is_profile_complete && strictHasData;

    if (!strictIsComplete) {
        return <PremiumLoader text="Redirecting" subText="Profile completion required..." />;
    }



    return (
        <div className="min-h-screen font-sans selection:bg-slate-900 selection:text-white bg-slate-50 flex flex-col">
            <Navbar />

            {/* --- Hero & Search Section --- */}
            <div className="relative bg-white border-b border-slate-200 overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-50/50 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

                <div className="container mx-auto px-6 max-w-5xl relative z-10 pt-12 pb-16">
                    <div className="text-center max-w-3xl mx-auto mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6 shadow-sm">
                            <Sparkles size={12} className="text-amber-400" />
                            <span>Official Exam Portal</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tighter">
                            {examParam ? (
                                <>Seat Allocation for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">{examParam}</span></>
                            ) : (
                                <>Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Exam Seat</span></>
                            )}
                        </h1>

                        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl mx-auto">
                            Enter your details below to instantly retrieve your hall ticket, room number, and real-time seat location.
                        </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/50 p-3 max-w-4xl mx-auto ring-1 ring-slate-200/50">
                        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-3">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Regular Input Search */}
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                                        <Hash size={18} />
                                    </div>
                                    <input
                                        name="regNo"
                                        value={formData.regNo}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder:text-slate-400 outline-none uppercase text-sm tracking-wide"
                                        placeholder="Full Reg Number"
                                    />
                                    {/* <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-400 uppercase tracking-wider">Example: 211FA04001</div> */}
                                </div>

                                {/* Branch Select */}
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                                        <BookOpen size={18} />
                                    </div>
                                    <select
                                        name="branch"
                                        value={formData.branch}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-10 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 outline-none cursor-pointer appearance-none text-sm"
                                    >
                                        <option value="">Select Branch</option>
                                        {branchOptions.map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                    <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                                </div>

                                {/* Year Select */}
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                                        <GraduationCap size={18} />
                                    </div>
                                    <select
                                        name="year"
                                        value={formData.year}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-10 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 outline-none cursor-pointer appearance-none text-sm"
                                    >
                                        <option value="">All Years</option>
                                        {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !formData.regNo || !formData.branch || !formData.year}
                                className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <>Search Allocation <ArrowRight size={18} /></>}
                            </button>
                        </form>
                    </div>

                    {/* Loader Overlay */}
                    {loading && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md">
                            <PremiumLoader text="Locating Seat" subText="Fetching real-time data..." />
                        </div>
                    )}

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-md mx-auto mt-8 flex items-center justify-center gap-3 text-rose-600 font-bold bg-rose-50 py-3 px-5 rounded-2xl border border-rose-100 text-sm shadow-sm">
                                <AlertCircle size={18} className="shrink-0" /> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>

            {/* --- Instructions Modal Overlay --- */}
            <AnimatePresence>
                {showInstructions && (
                    <InstructionsModal
                        onConfirm={confirmInstructions}
                        onClose={() => setShowInstructions(false)}
                    />
                )}
            </AnimatePresence>

            {/* --- Results Section --- */}
            <div id="results-section" className="flex-grow bg-[#f8f9fc]">
                <div className="container mx-auto px-4 md:px-6 py-12">
                    <AnimatePresence mode="wait">
                        {results && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-12"
                            >
                                {isSummary ? (
                                    // SUMMARY VIEW: Room Cards
                                    <div className="max-w-5xl mx-auto text-center">
                                        <h2 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">
                                            Seating Distribution for <span className="text-emerald-600">{formData.branch}</span>
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {results.map((roomInfo, i) => (
                                                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center hover:shadow-xl hover:border-emerald-500/20 transition-all duration-300">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                                                        <MapPin size={32} />
                                                    </div>
                                                    <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tighter">{roomInfo.room_name}</h3>
                                                    <div className="bg-slate-50 rounded-xl p-4 w-full border border-slate-100">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reg No Range</p>
                                                        <div className="flex items-center justify-center gap-2 text-slate-700 font-mono font-bold text-sm">
                                                            <span>{roomInfo.start_reg}</span>
                                                            <ArrowRight size={14} className="text-slate-300" />
                                                            <span>{roomInfo.end_reg}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 text-xs font-bold text-slate-400 uppercase">
                                                        {roomInfo.count} Students Allocated
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    // INDIVIDUAL VIEW: Hall Ticket Style
                                    results.map((seat, idx) => (
                                        <StudentResultItem key={seat.id} seat={seat} />
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// --- Result Item Container (Lifts State) ---

// --- Result Item Container (Lifts State) ---

function StudentResultItem({ seat }) {
    const [layout, setLayout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [seatLabel, setSeatLabel] = useState(seat.seat_number); // Default to raw number

    useEffect(() => {
        const fetchLayout = async () => {
            if (!seat?.ExamId || !seat?.room_name) return;
            try {
                const url = `http://127.0.0.1:5000/api/exams/${seat.ExamId}/rooms/${encodeURIComponent(seat.room_name)}/layout`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setLayout(data);

                    // Calculate Smart Label (e.g., A-5)
                    const mySeat = data.seats.find(s => s.seat_number === seat.seat_number);
                    if (mySeat) {
                        const rowChar = String.fromCharCode(64 + mySeat.row); // 1->A, 2->B
                        setSeatLabel(`${rowChar}-${mySeat.col}`);
                    }
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchLayout();
    }, [seat]);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Top: The Official Ticket */}
            <div className="w-full">
                <TicketCard seat={seat} seatLabel={seatLabel} />
            </div>

            {/* Bottom: The Live Map */}
            <div className="w-full">
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-10 relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10"></div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-slate-100 pb-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-widest mb-3">
                                <MapPin size={12} />
                                Live Seat Navigator
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                                Room <span className="text-indigo-600">{seat.room_name}</span>
                            </h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Live Sync
                            </div>
                        </div>
                    </div>

                    <TheaterView seat={seat} layout={layout} loading={loading} />
                </div>
            </div>
        </div>
    );
}

// --- Components ---

function TicketCard({ seat, seatLabel }) {
    // Logic to extract batch info if available
    const getBatchDetails = () => {
        if (seat.Exam.batches && Array.isArray(seat.Exam.batches)) {
            const regNo = seat.student_reg;
            const getNum = (str) => parseInt(str.replace(/\D/g, '')) || 0;
            const currentReg = getNum(regNo);
            return seat.Exam.batches.find(b => {
                const start = getNum(b.start_reg);
                const end = getNum(b.end_reg);
                return currentReg >= start && currentReg <= end;
            });
        }
        return null;
    };
    const batch = getBatchDetails();
    const branchDisplay = batch ? batch.branch : (seat.Exam.branch || 'N/A');
    const yearDisplay = batch ? batch.year : (seat.Exam.year || '');

    return (
        <div className="filter drop-shadow-xl">
            <div className="flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden">
                {/* Left: Main Event Info (Stub) */}
                <div className="bg-slate-900 text-white p-6 md:p-8 md:w-[320px] relative flex flex-col justify-between shrink-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-[50px] translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                                <GraduationCap className="text-emerald-400" size={20} />
                            </div>
                            <div className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                                Hall Ticket
                            </div>
                        </div>

                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Examination</p>
                            <h3 className="text-2xl font-black leading-tight mb-1">{seat.Exam.name}</h3>
                            <p className="text-indigo-300 font-medium text-sm">{batch?.subject || seat.Exam.subjects?.[0]}</p>
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 pt-8 border-t border-white/10 space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date</p>
                                <div className="flex items-center gap-2 font-bold">
                                    <Calendar size={14} className="text-emerald-400" />
                                    {new Date(seat.Exam.date).toLocaleDateString()}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-right">Time</p>
                                <div className="flex items-center gap-2 font-bold">
                                    <Clock size={14} className="text-emerald-400" />
                                    {seat.Exam.time}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Seat & Student Details */}
                <div className="flex-grow p-6 md:p-8 relative">
                    <div className="flex flex-col md:flex-row gap-8 h-full">
                        <div className="flex-grow space-y-6">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 uppercase tracking-wide">{branchDisplay}</span>
                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 uppercase tracking-wide">{yearDisplay}</span>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student</p>
                                <p className="text-xl font-black text-slate-900 tracking-tight">{seat.student_reg}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hall / Room</p>
                                    <p className="text-lg font-bold text-slate-800">{seat.room_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <div className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                                        <CheckCircle size={14} /> Confirmed
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Big Seat Number */}
                        <div className="flex flex-col justify-center items-center md:items-end border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 min-w-[140px]">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Allocated Seat</p>
                            <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl flex flex-col items-center shadow-lg shadow-slate-900/20">
                                <span className="text-4xl font-black tracking-tighter">{seatLabel}</span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 mt-3 text-center md:text-right max-w-[120px] leading-tight opacity-60">
                                Please occupy only this specific seat.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



function TheaterView({ seat, layout, loading }) {
    if (loading) return <div className="h-64 flex items-center justify-center text-indigo-600"><Loader2 className="animate-spin" size={32} /></div>;
    if (!layout) return <div className="text-center text-slate-400 text-sm py-12">Seating layout unavailable</div>;

    const { room, seats } = layout;

    // Helper to find batch color
    const getBatchColor = (regNo) => {
        if (!seat.Exam || !seat.Exam.batches) return null;
        const getNum = (str) => parseInt(str.replace(/\D/g, '')) || 0;
        const currentReg = getNum(regNo);
        const batch = seat.Exam.batches.find(b => {
            const start = getNum(b.start_reg);
            const end = getNum(b.end_reg);
            return currentReg >= start && currentReg <= end;
        });
        return batch ? batch.color : null;
    };


    const grid = [];
    for (let r = 1; r <= room.rows; r++) {
        const rowSeats = [];
        for (let c = 1; c <= room.cols; c++) {
            const occupied = seats.find(s => s.row === r && s.col === c);
            const isMySeat = occupied && occupied.seat_number === seat.seat_number;
            const isDisabled = room.disabled_seats && room.disabled_seats.includes(`${r}-${c}`);

            let batchStyle = null;
            if (occupied && !isMySeat) {
                const colorString = getBatchColor(occupied.student_reg);
                if (colorString) batchStyle = colorString;
            }

            rowSeats.push({ r, c, occupied, isMySeat, isDisabled, batchStyle });
        }
        grid.push(rowSeats);
    }

    return (
        <div className="flex flex-col items-center w-full max-w-full select-none">

            {/* Stage Indicatory */}
            <div className="w-full flex justify-center mb-8 px-4">
                <div className="w-full max-w-sm h-2 bg-slate-200 rounded-full relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Stage / Screen</div>
                </div>
            </div>

            {/* Room Grid - Horizontal Scroll Container */}
            <div className="w-full relative group">
                {/* Scroll Hints (Visible on Mobile) */}
                <div className="md:hidden absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                <div className="md:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                <div className="overflow-x-auto pb-12 custom-scrollbar flex justify-center min-h-[300px]">
                    <div className="flex flex-col-reverse gap-3 items-center px-8 md:px-0 min-w-max mx-auto">
                        {grid.map((row, ri) => (
                            <div key={ri} className="flex flex-row-reverse gap-2 md:gap-3 items-center">
                                {/* Row Label */}
                                <div className="w-6 text-center">
                                    <span className="text-[10px] md:text-xs font-black text-slate-300 uppercase">{String.fromCharCode(65 + ri)}</span>
                                </div>

                                {row.map((cell, ci) => {
                                    const isAisle = room.aisle_interval > 0 && (cell.c % room.aisle_interval === 0) && (cell.c !== room.cols);

                                    // Base Styles
                                    let baseClasses = "relative w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300 shadow-sm";
                                    let content = null;

                                    if (cell.isDisabled) {
                                        baseClasses += " bg-slate-50 border-slate-200 opacity-40";
                                        content = <span className="text-slate-300 text-xs">×</span>;
                                    }
                                    else if (cell.isMySeat) {
                                        baseClasses += " bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/30 z-20 scale-110";
                                        content = <span className="text-[10px] font-black text-white">{seat.student_reg.slice(-3)}</span>;
                                    }
                                    else if (cell.occupied) {
                                        if (cell.batchStyle) {
                                            baseClasses += ` ${cell.batchStyle} opacity-90`;
                                        } else {
                                            baseClasses += " bg-slate-100 border-slate-200";
                                        }
                                        content = <span className="text-[8px] font-bold text-slate-400 opacity-60">{cell.occupied.student_reg.slice(-3)}</span>;
                                    }
                                    else {
                                        baseClasses += " bg-white border-slate-200 hover:border-slate-300";
                                        content = <span className="text-[8px] font-bold text-slate-300">{cell.c}</span>;
                                    }

                                    return (
                                        <div key={`${cell.r}-${cell.c}`} className={`${baseClasses} ${isAisle ? 'ml-4 md:ml-8' : ''}`}>
                                            {content}
                                            {cell.isMySeat && (
                                                <div className="absolute -top-2 -right-2">
                                                    <span className="relative flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 border-2 border-white"></span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 mt-2 pb-6 border-t border-slate-100 pt-6 w-full">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-indigo-600 border border-indigo-500 shadow-sm"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">My Seat</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center text-[8px] font-bold">123</div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-white border border-slate-200"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Empty</span>
                </div>
            </div>
        </div>
    );
}

export default function StudentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>}>
            <StudentContent />
        </Suspense>
    );
}

function InstructionsModal({ onConfirm, onClose }) {
    const [isChecked, setIsChecked] = useState(false);

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
            >
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Examination Rules</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Mandatory Instructions</p>
                        </div>
                    </div>
                    {/* Mobile Close Handler (Pull Indicator) */}
                    <div className="sm:hidden w-12 h-1 bg-slate-300 rounded-full absolute top-3 left-1/2 -translate-x-1/2"></div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 space-y-4 text-sm text-slate-600 leading-relaxed custom-scrollbar">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-4 text-amber-800 font-medium text-xs flex gap-3 items-start">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <p>Strict Compliance Required: Failure to adhere to these rules may lead to immediate disqualification from the examination.</p>
                    </div>

                    <ul className="space-y-4 pl-2">
                        {[
                            "Students must enter the examination hall only 10–20 minutes before the commencement of the examination.",
                            "No student will be permitted after the examination starts, under any circumstances.",
                            "Students must write their Register Number clearly on the Question Paper and Answer Booklet in the space provided.",
                            "Do not write name, signature, or any identification marks other than the Register Number.",
                            "Hall Ticket and valid College ID are compulsory and must be shown on demand.",
                            "Use of mobile phones, smart watches, Bluetooth devices, earphones, or any electronic gadgets is strictly prohibited.",
                            "Students must occupy only the seat allotted as per the seating arrangement displayed.",
                            "Opening the Question Paper before the invigilator’s instruction is strictly prohibited.",
                            "Talking, whispering, signaling, or exchanging materials is strictly forbidden.",
                            "Only permitted stationery is allowed; sharing of materials is not permitted.",
                            "Rough work must be done only in the space provided in the answer booklet.",
                            "Any form of malpractice or unfair means will result in immediate cancellation of the examination.",
                            "Students must stop writing immediately when the final bell rings.",
                            "No student is allowed to leave the examination hall without the invigilator’s permission.",
                            "Violation of any of the above rules will lead to strict disciplinary action."
                        ].map((rule, i) => (
                            <li key={i} className="flex gap-3">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] flex items-center justify-center mt-0.5">{i + 1}</span>
                                <span>{rule}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 pb-8 sm:pb-6">
                    <label className="flex items-start gap-3 cursor-pointer group mb-6 select-none active:scale-[0.98] transition-transform">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300 group-hover:border-emerald-400'}`}>
                            {isChecked && <CheckCircle size={14} className="text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                            className="hidden"
                        />
                        <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                            I have read and understood the examination instructions.
                        </span>
                    </label>

                    <div className="flex gap-3 flex-col sm:flex-row">
                        <button
                            onClick={onClose}
                            className="order-2 sm:order-1 flex-1 py-3.5 sm:py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={!isChecked}
                            className={`order-1 sm:order-2 flex-1 py-3.5 sm:py-3 rounded-xl font-bold text-white text-sm shadow-lg flex items-center justify-center gap-2 transition-all ${isChecked ? 'bg-slate-900 hover:bg-black hover:scale-[1.02] active:scale-[0.98]' : 'bg-slate-400 cursor-not-allowed opacity-70'}`}
                        >
                            <TicketCardIcon className="w-4 h-4" />
                            View Room Allotment
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// Helper for icon since TicketCard is component
const TicketCardIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="13" x="3" y="6" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);
