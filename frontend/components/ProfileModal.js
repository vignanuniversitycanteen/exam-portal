'use client';
import { useState, useEffect } from 'react';
import { X, Shield, Key, Smartphone, CheckCircle, Loader2, AlertTriangle, Eye, EyeOff, Lock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/utils/config';

const PERMISSIONS_LIST = [
    { id: 'manage_admins', label: 'Manage Admins (Users)' },
    { id: 'manage_permissions', label: 'Manage Permissions' },
    { id: 'create_exams', label: 'Create Exams' },
    { id: 'edit_exams', label: 'Edit Exams' },
    { id: 'delete_exams', label: 'Delete Exams' },
    { id: 'archive_exams', label: 'Archive/Restore Exams' },
    { id: 'publish_exams', label: 'Publish Exams' },
    { id: 'download_attendance', label: 'Download Attendance' },
    { id: 'download_seating', label: 'Download Seating Charts' },
    { id: 'malpractice_entry', label: 'Malpractice Entry' }
];

export default function ProfileModal({ onClose }) {
    const [activeTab, setActiveTab] = useState('details'); // details, password, mfa
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Password State
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
    const [showPass, setShowPass] = useState(false);
    const [passLoading, setPassLoading] = useState(false);

    // MFA State
    const [mfaStep, setMfaStep] = useState('init'); // init, verify, success
    const [mfaData, setMfaData] = useState({ secret: '', otpauth: '', token: '', backup_codes: [] });

    // Backup Codes State
    const [viewCodes, setViewCodes] = useState(false);
    const [backupCodes, setBackupCodes] = useState([]);
    const [verifyPassOpen, setVerifyPassOpen] = useState(false);
    const [verifyAction, setVerifyAction] = useState(null);
    const [verifyPassInput, setVerifyPassInput] = useState('');
    const [verifyLoading, setVerifyLoading] = useState(false);

    const handleBackupAction = (action) => {
        setVerifyAction(action);
        setVerifyPassInput('');
        setVerifyPassOpen(true);
        setError('');
    };

    const submitBackupVerify = async (e) => {
        e.preventDefault();
        setVerifyLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const url = verifyAction === 'view' ? `${API_BASE_URL}/api/auth/backup-codes/view` : `${API_BASE_URL}/api/auth/backup-codes/regenerate`;

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: verifyPassInput })
            });

            // Check content type
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                setBackupCodes(data.backup_codes);
                setViewCodes(true);
                setVerifyPassOpen(false);
                if (verifyAction === 'regenerate') setSuccess('Backup codes regenerated. Previous codes are invalid.');
            } else {
                throw new Error("Backend update pending. Please RESTART server.js terminal.");
            }
        } catch (err) {
            setError(err.message.includes('Unexpected token') ? 'Server Error: Please restart backend.' : err.message);
        } finally {
            setVerifyLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load profile');
            const data = await res.json();
            setProfile(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (passData.new !== passData.confirm) return setError("New passwords don't match");
        if (passData.new.length < 6) return setError("Password must be at least 6 characters");

        setPassLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword: passData.current, newPassword: passData.new })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSuccess(data.message);
            setPassData({ current: '', new: '', confirm: '' });
        } catch (err) {
            setError(err.message);
        } finally {
            setPassLoading(false);
        }
    };

    const initMFA = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/auth/setup-mfa-init`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMfaData(prev => ({ ...prev, secret: data.secret, otpauth: data.otpauth_url }));
            setMfaStep('verify');
        } catch (err) { setError(err.message); }
    };

    const verifyMFA = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/auth/setup-mfa-verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ token: mfaData.token, secret: mfaData.secret })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setMfaData(prev => ({ ...prev, backup_codes: data.backup_codes }));
            setMfaStep('success');
            fetchProfile(); // Refresh status
        } catch (err) { setError(err.message); }
    };

    if (!profile && loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" /></div>;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <User className="text-indigo-600" /> My Profile
                        </h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">Manage your account settings and security</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition"><X size={20} /></button>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Sidebar / Mobile Nav Strip */}
                    <div className="w-full md:w-48 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-2 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto shrink-0 no-scrollbar">
                        <button onClick={() => setActiveTab('details')} className={`text-sm font-bold px-4 py-2 md:py-3 rounded-xl flex items-center gap-2 md:gap-3 transition-all whitespace-nowrap ${activeTab === 'details' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
                            <User size={16} /> Details
                        </button>
                        <button onClick={() => setActiveTab('password')} className={`text-sm font-bold px-4 py-2 md:py-3 rounded-xl flex items-center gap-2 md:gap-3 transition-all whitespace-nowrap ${activeTab === 'password' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
                            <Key size={16} /> Password
                        </button>
                        <button onClick={() => setActiveTab('mfa')} className={`text-sm font-bold px-4 py-2 md:py-3 rounded-xl flex items-center gap-2 md:gap-3 transition-all whitespace-nowrap ${activeTab === 'mfa' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
                            <Shield size={16} /> Security
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl flex items-center gap-2 border border-red-100">
                                <AlertTriangle size={16} /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl flex items-center gap-2 border border-emerald-100">
                                <CheckCircle size={16} /> {success}
                            </div>
                        )}

                        {activeTab === 'details' && profile && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                                        {profile.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">{profile.username}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${profile.role === 'main_admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {profile.role.replace('_', ' ')}
                                            </span>
                                            {profile.employee_id && <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-200">ID: {profile.employee_id}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Assigned Permissions</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.role === 'main_admin' ? (
                                            <div className="w-full p-3 bg-purple-50 border border-purple-100 rounded-xl flex items-center gap-2 text-purple-700 text-sm font-bold">
                                                <Shield size={16} /> Main Admin has full system access.
                                            </div>
                                        ) : (
                                            PERMISSIONS_LIST.map(perm => {
                                                const hasPerm = (profile.permissions || []).includes(perm.id);
                                                return (
                                                    <div key={perm.id} className={`text-xs px-3 py-1.5 rounded-lg border font-bold flex items-center gap-2 ${hasPerm ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'}`}>
                                                        {hasPerm ? <CheckCircle size={12} /> : <Lock size={12} />}
                                                        {perm.label}
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'password' && (
                            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Password</label>
                                    <input type="password" required value={passData.current} onChange={e => setPassData({ ...passData, current: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                                    <div className="relative">
                                        <input type={showPass ? "text" : "password"} required value={passData.new} onChange={e => setPassData({ ...passData, new: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm New Password</label>
                                    <input type="password" required value={passData.confirm} onChange={e => setPassData({ ...passData, confirm: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <button type="submit" disabled={passLoading} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition flex items-center gap-2">
                                    {passLoading && <Loader2 className="animate-spin" size={14} />} Update Password
                                </button>
                            </form>
                        )}

                        {activeTab === 'mfa' && profile && (
                            <div className="space-y-6 relative min-h-[300px]">
                                {profile.is_mfa_setup && mfaStep !== 'success' ? (
                                    <div className="space-y-6">
                                        {/* MFA Active Status Card */}
                                        <div className="p-5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl shadow-sm">
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                                        <Shield size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-slate-800">Two-Factor Authentication</h4>
                                                            <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-emerald-200">Active</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                                                            Your account is currently secured. You will be asked for a code when logging in from new devices.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-emerald-100/50 flex justify-end">
                                                <button
                                                    onClick={() => { if (confirm('Are you sure you want to reset your MFA configuration? You will need to set it up again immediately.')) initMFA() }}
                                                    className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition border border-transparent hover:border-amber-100 flex items-center gap-2"
                                                >
                                                    <Smartphone size={14} /> Re-configure / Reset 2FA
                                                </button>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-100 pt-6">
                                            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                <Lock size={16} className="text-indigo-600" /> Backup Codes
                                            </h4>
                                            <p className="text-xs text-slate-500 mb-4">
                                                Generate backup codes to access your account if you lose your authenticator device.
                                            </p>

                                            {!viewCodes ? (
                                                <button onClick={() => handleBackupAction('view')} className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition">
                                                    View Backup Codes
                                                </button>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                        {backupCodes.map((c, i) => (
                                                            <div key={i} className={`text-xs font-mono font-bold p-2 rounded flex justify-between items-center ${c.used ? 'bg-slate-200 text-slate-400 decoration-slate-500 decoration-2 line-through' : 'bg-white text-slate-700 shadow-sm'}`}>
                                                                <span>{c.code}</span>
                                                                {c.used && <span className="text-[9px] bg-slate-400 text-white px-1.5 py-0.5 rounded ml-2">USED</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button onClick={() => setViewCodes(false)} className="text-xs font-bold text-slate-500 hover:text-slate-800">Close</button>
                                                        <button onClick={() => handleBackupAction('regenerate')} className="text-xs font-bold text-red-600 hover:text-red-800">Regenerate New Codes</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {mfaStep === 'init' && (
                                            <div className="text-center py-8">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                                    <Smartphone size={32} />
                                                </div>
                                                <h3 className="font-bold text-slate-800 text-lg">Setup Authenticator</h3>
                                                <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">Secure your account by linking with Google Authenticator or Authy.</p>
                                                <button onClick={initMFA} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition">
                                                    Start Setup
                                                </button>
                                            </div>
                                        )}

                                        {mfaStep === 'verify' && (
                                            <div className="space-y-4">
                                                <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col items-center">
                                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(mfaData.otpauth)}`} alt="QR Code" className="w-32 h-32 mb-4" />
                                                    <p className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded text-slate-600 select-all">{mfaData.secret}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter 6-digit Code"
                                                        value={mfaData.token}
                                                        onChange={e => setMfaData({ ...mfaData, token: e.target.value })}
                                                        className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-center font-bold tracking-widest outline-none focus:border-indigo-500"
                                                        maxLength={6}
                                                    />
                                                    <button onClick={verifyMFA} className="bg-slate-900 text-white px-4 rounded-xl font-bold text-sm">Verify</button>
                                                </div>
                                            </div>
                                        )}

                                        {mfaStep === 'success' && (
                                            <div className="text-center py-6">
                                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                                                    <CheckCircle size={32} />
                                                </div>
                                                <h3 className="font-bold text-slate-800 text-lg">Setup Complete!</h3>
                                                <p className="text-slate-500 text-sm mb-6">Save these backup codes in a safe place.</p>
                                                <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                                                    {mfaData.backup_codes.map((code, i) => (
                                                        <code key={i} className="text-xs font-mono font-bold text-slate-600">{code}</code>
                                                    ))}
                                                </div>
                                                <button onClick={() => setActiveTab('details')} className="text-slate-500 hover:text-slate-800 font-bold text-sm">Done</button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Password Verification Overlay */}
                                {verifyPassOpen && (
                                    <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-200 rounded-xl">
                                        <h3 className="font-bold text-slate-800 text-lg mb-4">Verify Password</h3>
                                        <p className="text-xs text-slate-500 mb-6 text-center max-w-[200px]">
                                            Please enter your password to {verifyAction === 'view' ? 'view' : 'regenerate'} backup codes.
                                        </p>
                                        <form onSubmit={submitBackupVerify} className="w-full max-w-xs space-y-4">
                                            <input
                                                type="password"
                                                placeholder="Enter your password"
                                                className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                value={verifyPassInput}
                                                onChange={e => setVerifyPassInput(e.target.value)}
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setVerifyPassOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl font-bold text-sm hover:bg-slate-200">Cancel</button>
                                                <button type="submit" disabled={verifyLoading} className="flex-1 bg-slate-900 text-white py-2 rounded-xl font-bold text-sm hover:bg-black flex justify-center items-center">
                                                    {verifyLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div >
        </div >
    );
}
