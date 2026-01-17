'use client';

import { useState, useRef } from 'react';
import { Lock, User, ShieldCheck, ArrowRight, Loader2, GraduationCap, Smartphone, CheckCircle, RefreshCw, Download, AlertTriangle, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE_URL } from '@/utils/config';

export default function AdminLogin() {
    const [formData, setFormData] = useState({ username: '', password: '', mfa_token: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showMFA, setShowMFA] = useState(false);

    // Setup Mode States
    const [setupMode, setSetupMode] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [mfaSecret, setMfaSecret] = useState('');
    const [tempToken, setTempToken] = useState(null);
    const [setupStep, setSetupStep] = useState(1); // 1: QR, 2: Backup Codes
    const [backupCodes, setBackupCodes] = useState([]);
    const [isDownloaded, setIsDownloaded] = useState(false);

    const mfaInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'mfa_token' ? value.toUpperCase() : value
        });
    };

    // 1. Initial Login
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                if (data.mfa_setup_required) {
                    setTempToken(data.temp_token);
                    setSetupMode(true);
                    initiateSetup(data.temp_token);
                } else {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('role', data.role);
                    localStorage.setItem('permissions', JSON.stringify(data.permissions || []));
                    window.location.href = '/admin';
                }
            } else {
                if (res.status === 403 && data.mfa_required) {
                    setShowMFA(true);
                    setError('Enter TOTP from Authenticator or Backup Code');
                    setTimeout(() => mfaInputRef.current?.focus(), 100);
                } else {
                    setError(data.error || 'Login Failed');
                }
            }
        } catch (err) {
            setError('Connection failed. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    // 2. Fetch QR for Setup
    const initiateSetup = async (token) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/mfa/setup`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setQrCode(data.qr_code);
                setMfaSecret(data.secret);
            }
            else setError('Setup Failed: ' + data.error);
        } catch (e) { setError('Network Error during setup'); }
    };

    // 3. Verify Setup
    const handleSetupVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/mfa/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempToken}`
                },
                body: JSON.stringify({ token: formData.mfa_token })
            });

            const data = await res.json();
            if (res.ok) {
                setBackupCodes(data.backup_codes);
                setSetupStep(2); // Show backup codes
            } else {
                setError(data.error || 'Verification Failed');
            }
        } catch (e) { setError('Verification Error'); }
        finally { setLoading(false); }
    };

    // 4. Finalize & Go to Login
    const finishSetup = () => {
        setSetupMode(false);
        setSetupStep(1);
        setFormData({ ...formData, mfa_token: '' });
        setError('MFA Enabled. Please login again with your code.');
        setShowMFA(true);
    };



    const handleDownloadCodes = () => {
        const text = `Vignan Exam Portal - Backup Codes\n\nGenerated on: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKEEP THESE CODES SECURE!`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vignan-backup-codes.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsDownloaded(true);
    };

    if (setupMode) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>

                    {setupStep === 1 ? (
                        <>
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
                                    <Smartphone className="text-emerald-500" /> Setup Authenticator
                                </h1>
                                <p className="text-slate-500 text-sm mt-2">Scan this QR code with Google Authenticator</p>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold border border-red-200 shadow-sm"
                                    >
                                        <AlertTriangle size={16} /> {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex flex-col items-center justify-center mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                {qrCode ? (
                                    <>
                                        <img src={qrCode} alt="QR Code" className="mix-blend-multiply mb-3" />
                                        <div className="w-full text-center">
                                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Manual Setup Code</p>
                                            <code className="block w-full bg-white border border-slate-200 p-2 rounded text-xs font-mono text-slate-600 select-all cursor-text break-all">
                                                {mfaSecret}
                                            </code>
                                        </div>
                                    </>
                                ) : <Loader2 className="animate-spin text-slate-300" />}
                            </div>

                            <form onSubmit={handleSetupVerify} className="space-y-4">
                                <input
                                    name="mfa_token"
                                    value={formData.mfa_token}
                                    onChange={handleChange}
                                    className="w-full text-center text-2xl font-mono tracking-widest font-bold border-2 border-emerald-100 rounded-lg py-3 focus:border-emerald-500 outline-none transition-colors"
                                    placeholder="000 000"
                                    maxLength={6}
                                />
                                <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2">
                                    {loading && <Loader2 className="animate-spin" size={18} />} Verify & Activate
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
                                    <ShieldCheck className="text-emerald-500" /> Save Backup Codes
                                </h1>
                                <p className="text-red-500 text-xs font-bold mt-2 uppercase tracking-wide">Important: Save these codes securely!</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-sm text-slate-700 font-bold">
                                {backupCodes.map((code, i) => (
                                    <div key={i} className="bg-white px-2 py-1 rounded border border-slate-100 text-center">{code}</div>
                                ))}
                            </div>

                            <AnimatePresence>
                                {isDownloaded && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="mb-4 bg-emerald-100 text-emerald-800 p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold border border-emerald-200"
                                    >
                                        <CheckCircle size={16} /> Successfully Downloaded!
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex gap-3">
                                <button onClick={handleDownloadCodes} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2">
                                    <Download size={18} /> Download
                                </button>
                                <motion.button
                                    onClick={finishSetup}
                                    animate={isDownloaded ? {
                                        scale: [1, 1.05, 1],
                                        boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.7)",
                                        backgroundColor: "#059669"
                                    } : {}}
                                    transition={isDownloaded ? {
                                        duration: 1.5,
                                        repeat: Infinity,
                                        repeatType: "loop"
                                    } : {}}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex-1 font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg ${isDownloaded ? 'text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                >
                                    <CheckCircle size={18} /> Done
                                </motion.button>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative z-10"
            >
                {/* Header */}
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 z-0"></div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500 z-10"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
                            <GraduationCap className="text-emerald-400" size={24} />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">Admin Portal</h1>
                        <p className="text-slate-400 text-sm">Sign in to manage examinations</p>
                    </div>
                </div>

                {/* Form */}
                <div className="p-8 pt-10">
                    <form onSubmit={handleLogin} className="space-y-6">

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 border border-red-100 mb-4"
                            >
                                <ShieldCheck size={16} />
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Employee ID / Username</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                <input
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none placeholder:text-slate-400"
                                    placeholder="Enter Employee ID or Username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* MFA Field */}
                        <AnimatePresence>
                            {showMFA && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-1 pt-2">
                                        <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider ml-1 flex items-center gap-1">
                                            <ShieldCheck size={12} /> Authenticator Code
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-emerald-100 rounded flex items-center justify-center text-emerald-600 font-bold text-xs">
                                                #
                                            </div>
                                            <input
                                                type="text"
                                                name="mfa_token"
                                                ref={mfaInputRef}
                                                value={formData.mfa_token}
                                                onChange={handleChange}
                                                className="w-full bg-emerald-50/50 border border-emerald-200 rounded-lg pl-10 pr-4 py-3 font-bold text-emerald-800 tracking-widest focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none placeholder:text-emerald-300/50 uppercase"
                                                placeholder="CODE"
                                                maxLength={6}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 ml-1 mt-1">Or use a backup code</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-slate-900 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none group"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : (
                                <>
                                    {showMFA ? 'Verify & Login' : 'Login'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Admin Manual Download Section */}
                <div className="bg-slate-50 p-6 border-t border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                        <BookOpen className="text-emerald-600" size={20} />
                    </div>
                    <h3 className="text-slate-800 font-bold mb-1">New to the Portal?</h3>
                    <p className="text-xs text-slate-500 mb-4 max-w-[250px]">
                        Download the comprehensive admin guide for login instructions, managing exams, and understanding permissions.
                    </p>
                    <button
                        onClick={() => import('@/utils/AdminManualGenerator').then(mod => mod.generateAdminManual())}
                        className="text-xs font-bold text-emerald-600 border border-emerald-200 bg-white hover:bg-emerald-50 px-4 py-2 rounded-full transition-colors flex items-center gap-2"
                    >
                        <Download size={14} /> Download Manual PDF
                    </button>
                </div>

                <div className="bg-slate-100/50 p-3 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Restricted Access • Authorized Personnel Only</p>
                </div>
            </motion.div>
        </div>
    );
}
