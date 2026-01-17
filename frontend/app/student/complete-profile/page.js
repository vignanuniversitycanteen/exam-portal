'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, BookOpen, Calendar, Layers, Hash, CheckCircle, AlertCircle, Sparkles, LogOut, ArrowRight, Loader2, Info } from 'lucide-react';

import { API_BASE_URL } from '@/utils/config';

export default function CompleteProfile() {
    const { user, login } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // OTP / Verification State
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        email: '', // Add email
        reg_no: '',
        branch: '',
        section: '',
        academic_start: '',
        academic_end: '',
        mobile_number: '',
        gender: '',
        dob: ''
    });

    // Lock Reg No if it comes from valid University Email
    const [isRegLocked, setIsRegLocked] = useState(false);

    useEffect(() => {
        if (user) {
            let prefillRegNo = user.reg_no || '';
            let shouldLock = false;

            if (user.email && user.email.endsWith('@vignan.ac.in')) {
                const derivedRegNo = user.email.split('@')[0].toUpperCase();
                prefillRegNo = derivedRegNo;
                shouldLock = true;
            }

            setIsRegLocked(shouldLock);
            setIsEmailVerified(user.is_email_verified || false);

            setFormData(prev => ({
                ...prev,
                full_name: user.full_name || prev.full_name,
                email: user.email || prev.email,
                reg_no: prefillRegNo || prev.reg_no,
                branch: user.branch || prev.branch,
                section: user.section || prev.section,
                academic_start: user.academic_start || prev.academic_start,
                academic_end: user.academic_end || prev.academic_end,
                mobile_number: user.mobile_number || prev.mobile_number,
                gender: user.gender || prev.gender,
                dob: user.dob || prev.dob
            }));
        }
    }, [user]);

    // Redirection if already complete
    useEffect(() => {
        if (user && user.is_profile_complete) {
            router.push('/');
        }
    }, [user, router]);

    // OTP Timer
    useEffect(() => {
        let interval;
        if (otpTimer > 0) {
            interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [otpTimer]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSendOtp = async () => {
        setError('');
        setVerificationLoading(true);
        try {
            console.log('[DEBUG] Sending OTP to:', formData.email);
            const res = await fetch(`${API_BASE_URL}/api/auth/send-verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('studentToken')}`
                },
                body: JSON.stringify({ email: formData.email })
            });
            const data = await res.json();
            console.log('[DEBUG] Send OTP Response:', data);

            if (res.ok) {
                setShowOtpModal(true);
                setOtpTimer(600); // 10 mins

                // DEV ONLY: If email fails but backend returns a dev_otp, show it
                if (data.dev_otp) {
                    alert(`[DEV MODE] Email failed (likely missing credentials). Your OTP is: ${data.dev_otp}`);
                    console.warn('[DEV] OTP:', data.dev_otp);
                }
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch (err) {
            console.error('[DEBUG] Send OTP Error:', err);
            setError('Connection failed. Please try again.');
        } finally {
            setVerificationLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setError('');
        setVerificationLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/verify-email-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('studentToken')}`
                },
                body: JSON.stringify({ email: formData.email, otp })
            });
            const data = await res.json();
            if (res.ok) {
                setIsEmailVerified(true);
                setShowOtpModal(false);
                setOtp(''); // Clear OTP
            } else {
                setError(data.error || 'Invalid OTP');
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
        } finally {
            setVerificationLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isEmailVerified) {
            setError('Please verify your email address to continue.');
            return;
        }

        setLoading(true);

        try {
            const payload = { ...formData }; // Email is already in formData

            console.log('[DEBUG] Submitting Profile:', payload);
            const res = await fetch(`${API_BASE_URL}/api/student/complete-profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('studentToken')}`
                },
                body: JSON.stringify(payload)
            });
            console.log('[DEBUG] Profile Response Status:', res.status);

            const data = await res.json();

            if (res.ok) {
                // Update global state immediately. We use isNew: false because they just finished it.
                login(data.user, localStorage.getItem('studentToken'), false);
                router.push('/');
            } else {
                setError(data.error || 'Failed to update profile');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (formData.academic_start && !formData.academic_end) {
            setFormData(prev => ({
                ...prev,
                academic_end: parseInt(prev.academic_start) + 4
            }));
        }
    }, [formData.academic_start]);

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[100px] -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-50/50 rounded-full blur-[100px] -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl w-full mx-auto space-y-8 relative z-10"
            >
                {/* Header */}
                <div className="text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm"
                    >
                        <Sparkles size={14} className="text-indigo-600" />
                        <span>Profile Completion</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                        Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Student</span>
                    </h2>
                    <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
                        Verify your details to access personalized exam schedules and digital hall tickets.
                    </p>
                </div>

                {/* Main Card (Premium Glassmorphic) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden relative"
                >
                    {/* User Identity Banner */}
                    <div className="bg-slate-900 px-8 py-8 flex items-center justify-between relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="flex items-center gap-6 relative z-10">
                            <motion.div
                                initial={{ rotate: -10, scale: 0.8 }}
                                animate={{ rotate: 0, scale: 1 }}
                                className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-2xl shadow-2xl ring-4 ring-slate-800"
                            >
                                {user?.email?.charAt(0).toUpperCase() || 'S'}
                            </motion.div>
                            <div>
                                <p className="text-white font-black text-xl tracking-tight mb-1">{user?.email}</p>
                                <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <CheckCircle size={14} />
                                    <span>Encrypted Session</span>
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                localStorage.removeItem('studentToken');
                                localStorage.removeItem('studentUser');
                                router.push('/student/login');
                            }}
                            className="p-3 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/10 relative z-10"
                            title="Sign Out"
                        >
                            <LogOut size={22} />
                        </motion.button>
                    </div>

                    <div className="p-8 md:p-12">
                        <div className="mb-10 p-5 bg-indigo-50/50 border border-indigo-100 rounded-[1.5rem] flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                <Info className="text-indigo-600" size={20} />
                            </div>
                            <div>
                                <h4 className="text-indigo-900 font-black text-sm uppercase tracking-wider">Account Activation</h4>
                                <p className="text-indigo-600 text-sm mt-1 font-medium">Please complete your profile details to unlock your digital hall ticket and personalized exam schedule. This is a one-time setup for new accounts.</p>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-10 p-5 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex items-start gap-4 shadow-sm"
                            >
                                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                    <AlertCircle className="text-rose-600" size={20} />
                                </div>
                                <div>
                                    <h4 className="text-rose-800 font-black text-sm uppercase tracking-wider">Authentication Error</h4>
                                    <p className="text-rose-600 text-sm mt-1 font-medium">{error}</p>
                                </div>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Personal Details */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                                    <User size={20} className="text-slate-400" />
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">University Email</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">@</div>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                readOnly
                                                className="w-full pl-11 pr-32 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-not-allowed font-medium text-slate-600"
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                {isEmailVerified ? (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                                        <CheckCircle size={14} />
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleSendOtp}
                                                        disabled={verificationLoading}
                                                        className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors disabled:opacity-50"
                                                    >
                                                        {verificationLoading ? 'Sending...' : 'Verify Now'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Eg. John Doe"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registration Number</label>
                                        <div className="relative">
                                            {isRegLocked ? (
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
                                                    <CheckCircle size={18} />
                                                </div>
                                            ) : (
                                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            )}

                                            <input
                                                type="text"
                                                name="reg_no"
                                                value={formData.reg_no}
                                                onChange={handleChange}
                                                required
                                                readOnly={isRegLocked}
                                                disabled={isRegLocked}
                                                placeholder="Eg. 211FA04113"
                                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none transition-all font-bold text-slate-900 ${isRegLocked
                                                    ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-80'
                                                    : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white'
                                                    }`}
                                            />
                                            {isRegLocked && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                    Verified From Email
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label>
                                        <input
                                            type="tel"
                                            name="mobile_number"
                                            value={formData.mobile_number}
                                            onChange={handleChange}
                                            required
                                            placeholder="Eg. 9876543210"
                                            pattern="[0-9]{10}"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-900"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="date"
                                                name="dob"
                                                value={formData.dob}
                                                onChange={handleChange}
                                                required
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-900"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gender</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-900 appearance-none"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Academic Details */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                                    <BookOpen size={20} className="text-slate-400" />
                                    Academic Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</label>
                                        <select
                                            name="branch"
                                            value={formData.branch}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-900 appearance-none"
                                        >
                                            <option value="">Select Branch</option>
                                            <option value="CSE">CSE</option>
                                            <option value="ECE">ECE</option>
                                            <option value="IT">IT</option>
                                            <option value="EEE">EEE</option>
                                            <option value="MECH">MECH</option>
                                            <option value="CIVIL">CIVIL</option>
                                            <option value="BIO-TECH">BIO-TECH</option>
                                            <option value="AI&DS">AI&DS</option>
                                            <option value="CSBS">CSBS</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Section</label>
                                        <div className="relative">
                                            <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                name="section"
                                                value={formData.section}
                                                onChange={handleChange}
                                                required
                                                placeholder="Eg. A"
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-900"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Year</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="number"
                                                name="academic_start"
                                                value={formData.academic_start}
                                                onChange={handleChange}
                                                required
                                                min="2015"
                                                max="2030"
                                                placeholder="2021"
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-900"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Year</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="number"
                                                name="academic_end"
                                                value={formData.academic_end}
                                                onChange={handleChange}
                                                required
                                                min="2015"
                                                max="2034"
                                                placeholder="2025"
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-900"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 flex items-center gap-3 text-sm md:text-base"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Saving Profile...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Complete Setup</span>
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* OTP Modal */}
                    {showOtpModal && (
                        <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-md flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 max-w-sm w-full relative"
                            >
                                <button
                                    onClick={() => setShowOtpModal(false)}
                                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                                >
                                    <LogOut className="rotate-45" size={24} />
                                </button>

                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">Verify Email</h3>
                                    <p className="text-slate-500 text-sm mt-2">
                                        Enter the 6-digit code sent to<br />
                                        <span className="font-bold text-slate-900">{formData.email}</span>
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                        placeholder="000000"
                                        className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 border-b-2 border-slate-200 focus:border-indigo-600 outline-none transition-colors text-slate-900 placeholder:text-slate-200"
                                        autoFocus
                                    />
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                                        <span>Expires in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</span>
                                        {otpTimer === 0 && (
                                            <button onClick={handleSendOtp} className="text-indigo-600 hover:underline">
                                                Resend Code
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleVerifyOtp}
                                        disabled={otp.length !== 6 || verificationLoading}
                                        className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 mt-4"
                                    >
                                        {verificationLoading ? 'Verifying...' : 'Verify Code'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                </motion.div>
            </motion.div>
        </div>
    );
}
