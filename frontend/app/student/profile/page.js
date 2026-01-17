'use client';
import { useAuth } from '../../../context/AuthContext';
import Navbar from '../../../components/Navbar';
import PremiumLoader from '../../../components/PremiumLoader';
import { motion } from 'framer-motion';
import {
    LogOut,
    User,
    Hash,
    Layers,
    Calendar,
    Users,
    Sparkles,
    ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function StudentProfile() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        if (user) {
            // Strict Check: If ANY essential data is missing, redirect.
            const hasData = user.branch && user.academic_start && user.branch !== '-' && user.academic_start > 0;
            const isComplete = user.is_profile_complete && hasData;

            if (!isComplete) {
                router.push('/student/complete-profile');
            }
        } else {
            router.push('/student/login');
        }
    }, [user, router]);

    if (!user) return null;

    const strictHasData = user?.branch && user?.academic_start && user?.branch !== '-' && user?.academic_start > 0;
    const strictIsComplete = user?.is_profile_complete && strictHasData;

    if (!strictIsComplete) {
        return <PremiumLoader text="Redirecting" subText="Profile completion required..." />;
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-sans pb-12">
            <Navbar />

            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/60 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-50/60 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>
            </div>

            <main className="container mx-auto px-4 md:px-6 relative z-10 pt-8 md:pt-16 max-w-2xl">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header Section */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full p-1 shadow-2xl shadow-slate-200/50 mb-6 relative">
                            {user.photo ? (
                                <img src={user.photo} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                    <User size={40} strokeWidth={1.5} />
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                                <ShieldCheck size={14} className="text-white" />
                            </div>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
                            {user.full_name}
                        </h1>
                        <p className="text-slate-500 font-medium text-lg">Student Profile</p>
                    </div>

                    {/* Main Details Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
                        {/* Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[2.5rem] -z-0"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 relative z-10">

                            <InfoGroup
                                icon={<Hash size={18} />}
                                label="Registration Number"
                                value={user.reg_no}
                                delay={0.1}
                            />

                            <InfoGroup
                                icon={<Layers size={18} />}
                                label="Branch"
                                value={user.branch}
                                delay={0.2}
                                highlight
                            />

                            <InfoGroup
                                icon={<Users size={18} />}
                                label="Section"
                                value={user.section}
                                delay={0.3}
                            />

                            <InfoGroup
                                icon={<Calendar size={18} />}
                                label="Program Duration"
                                value={(user.academic_start && user.academic_end) ? `${user.academic_start} - ${user.academic_end}` : '—'}
                                delay={0.4}
                            />

                        </div>

                        {/* Divider */}
                        <div className="my-10 border-t border-slate-100"></div>

                        {/* Action Area */}
                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="group flex items-center gap-3 px-8 py-4 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-2xl transition-all duration-300 font-bold tracking-wide"
                            >
                                <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                                Sign Out
                            </button>
                        </div>
                    </div>

                    <p className="text-center mt-12 text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">
                        Vignan University • Portal
                    </p>

                </motion.div>

                {/* LOGOUT CONFIRMATION MODAL */}
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-slate-100"
                        >
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                                <LogOut size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Sign Out?</h3>
                            <p className="text-slate-500 text-sm font-medium mb-8">You will need to login again to access your hall ticket.</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={logout}
                                    className="py-3.5 rounded-2xl font-bold bg-slate-900 text-white hover:bg-black transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transform"
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
}

function InfoGroup({ icon, label, value, delay, highlight }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + delay, duration: 0.4 }}
            className="flex flex-col gap-3 group"
        >
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                <span className={`p-1.5 rounded-md ${highlight ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-500'} transition-colors`}>
                    {icon}
                </span>
                {label}
            </div>
            <div className={`text-xl md:text-2xl font-black ${highlight ? 'text-indigo-600' : 'text-slate-900'} pl-2 border-l-2 ${highlight ? 'border-indigo-100' : 'border-transparent'} py-1`}>
                {value || '—'}
            </div>
        </motion.div>
    );
}
