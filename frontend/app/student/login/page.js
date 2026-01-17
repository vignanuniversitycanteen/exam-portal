'use client';
import { useAuth } from '../../../context/AuthContext';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Loader2, Sparkles, Info, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import PremiumLoader from '../../../components/PremiumLoader';

import { API_BASE_URL } from '@/utils/config';

export default function StudentLogin() {
    const { login, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showInvalidFormatModal, setShowInvalidFormatModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        // Don't auto-redirect if we are in the middle of a login callback
        if (token) return;

        if (!loading && user) {
            // Improved Check: Redirect based on profile status
            if (user.is_profile_complete) {
                router.push('/');
            } else {
                router.push('/student/complete-profile');
            }
        }
    }, [user, loading, router]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const email = urlParams.get('email');
        const errorParam = urlParams.get('error');

        if (errorParam) {
            if (errorParam === 'invalid_domain') {
                setError('Only @vignan.ac.in emails are allowed.');
            } else if (errorParam === 'server_error') {
                setError('A server error occurred. Please try again.');
            } else {
                setError('Authentication failed. Please try again.');
            }
        }

        if (token && email && !loading) {
            const urlParams = new URLSearchParams(window.location.search);
            const isNewUser = urlParams.get('isNewUser') === 'true';

            // Check if we already handled this
            const emailPrefix = email.split('@')[0];
            const isStudentFormat = /^[0-9]{2}[1-9][fF][a-zA-Z0-9]+$/.test(emailPrefix);

            if (isStudentFormat) {
                setLoading(true); // Reuse loading state to block multiple calls
                const finalizeLogin = async () => {
                    try {
                        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                            const userData = await res.json();
                            // If isNewUser is false (existing user), login will land them on /student
                            // If isNewUser is true, login will send them to /student/complete-profile
                            login(userData, token, isNewUser);
                        } else {
                            setError('Session validation failed.');
                            setLoading(false);
                        }
                    } catch (err) {
                        setError('Connection error.');
                        setLoading(false);
                    }
                };
                finalizeLogin();
            } else {
                setShowInvalidFormatModal(true);
            }
        }
    }, [router, login, loading]);

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            <Navbar />

            <main className="flex-grow flex flex-col lg:flex-row">

                {/* Left: Login Form Section */}
                <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden bg-white">
                    {/* Background Decor */}
                    <div className="lg:hidden absolute top-[-10%] right-[-5%] w-[300px] h-[300px] bg-indigo-50/50 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="max-w-md w-full relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="space-y-8"
                        >
                            <div className="text-center lg:text-left">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="hidden lg:inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-6 shadow-sm"
                                >
                                    <Sparkles size={12} className="text-indigo-600" />
                                    <span>Official Student Portal</span>
                                </motion.div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] mb-4 tracking-tighter">
                                    Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Login</span>
                                </h1>
                                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                    Access exam schedules, seating plans, and hall tickets.
                                </p>
                            </div>

                            {/* Login Card (Premium Microsoft Style) */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative"
                            >
                                {/* Decorative Gradient Blobs */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                                <div className="p-8 md:p-10 relative z-10">
                                    {/* Brand / Header */}
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg transform -rotate-6">
                                            <ShieldCheck size={20} className="text-white" />
                                        </div>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Secure Entry</span>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold flex gap-3 items-center"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                                <Info size={16} />
                                            </div>
                                            {error}
                                        </motion.div>
                                    )}

                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Welcome Back</h3>
                                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                                Please sign in with your official university email (<strong className="text-slate-900 border-b-2 border-indigo-200">@vignan.ac.in</strong>) to access your dashboard.
                                            </p>
                                        </div>

                                        <motion.a
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            href={`${API_BASE_URL}/api/auth/microsoft`}
                                            className="flex items-center justify-center gap-4 w-full bg-[#0078D4] text-white font-bold py-5 rounded-[1.5rem] hover:bg-[#006cbd] transition-all shadow-xl shadow-blue-200 group text-base overflow-hidden relative"
                                        >

                                            {/* Button Glint Animation */}
                                            <motion.div
                                                animate={{ x: ['100%', '-100%'] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                                            />

                                            {/* Premium Microsoft Logo Animation */}
                                            <div className="grid grid-cols-2 gap-1 w-5 h-5 relative z-10">
                                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="bg-[#F25022] w-full h-full rounded-[1px]"></motion.div>
                                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} className="bg-[#7FBA00] w-full h-full rounded-[1px]"></motion.div>
                                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} className="bg-[#00A4EF] w-full h-full rounded-[1px]"></motion.div>
                                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.9 }} className="bg-[#FFB900] w-full h-full rounded-[1px]"></motion.div>
                                            </div>
                                            <span className="relative z-10 flex items-center gap-2">
                                                Sign in with Microsoft
                                                <ArrowRight size={20} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                            </span>
                                        </motion.a>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

                {/* Right: Visual Section (Desktop Only) */}
                <div className="hidden lg:flex flex-1 bg-slate-900 relative items-center justify-center overflow-hidden">
                    {/* Background & Noise */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="relative z-10 max-w-lg text-center p-12">
                        {/* Floating Cards Visual */}
                        <div className="relative h-64 w-full mb-12 perspective-[1000px]">
                            {/* Card 1 (Back) */}
                            <motion.div
                                animate={{ y: [0, -10, 0], rotate: [-6, -8, -6] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-4 left-8 right-8 h-48 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl opacity-60"
                            />
                            {/* Card 2 (Middle) */}
                            <motion.div
                                animate={{ y: [0, -15, 0], rotate: [3, 5, 3] }}
                                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute top-0 left-4 right-4 h-48 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl opacity-80"
                            />
                            {/* Card 3 (Checkmark Front) */}
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-4 left-0 right-0 h-48 bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center border-4 border-indigo-500/20"
                            >
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
                                    <ShieldCheck size={32} />
                                </div>
                                <div className="h-2 w-32 bg-slate-100 rounded-full mb-2"></div>
                                <div className="h-2 w-20 bg-slate-100 rounded-full"></div>
                            </motion.div>
                        </div>

                        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Examination Management System</h2>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            A secure, real-time platform for managing exam logistics, seating allocations, and student verification.
                        </p>
                    </div>
                </div>

            </main>

            {/* Invalid Format Modal */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showInvalidFormatModal ? 1 : 0 }}
                className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${showInvalidFormatModal ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: showInvalidFormatModal ? 1 : 0.9, opacity: showInvalidFormatModal ? 1 : 0, y: showInvalidFormatModal ? 0 : 20 }}
                    className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
                >
                    <div className="relative h-32 bg-indigo-600 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="bg-white/20 p-4 rounded-full backdrop-blur-md relative z-10"
                        >
                            <ShieldCheck size={48} className="text-white" />
                        </motion.div>
                        {/* Abstract Decor */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    </div>

                    <div className="p-8 text-center">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Invalid Email Format</h3>
                        <p className="text-slate-500 font-medium leading-relaxed mb-8">
                            Only student accounts with <strong className="text-indigo-600">reg.no@vignan.ac.in</strong> (e.g., 211fa04113@vignan.ac.in) are allowed to access the Student Portal.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setShowInvalidFormatModal(false);
                                    router.replace('/student/login');
                                }}
                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 group"
                            >
                                <span>Try Another Account</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-all" />
                            </button>

                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2">
                                If you are staff, please use the Admin Portal
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-center gap-2">
                        <Info size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Security Policy Enforced</span>
                    </div>
                </motion.div>
            </motion.div>

            {/* Loading Overlay */}
            {loading && <PremiumLoader text="Authenticating" subText="Verifying credentials..." />}
        </div >
    );
}
