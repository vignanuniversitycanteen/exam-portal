'use client';
import Link from 'next/link';
import { GraduationCap, LayoutDashboard, Search, Radio, User, LogOut, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleLogout = async () => {
        setIsSigningOut(true);
        // Small delay to show the loading state (UX)
        await new Promise(resolve => setTimeout(resolve, 800));
        logout();
        setShowProfileMenu(false);
        setIsSigningOut(false);
    };

    const isActive = (path) => pathname === path;

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm transition-all">
            <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="bg-slate-900 p-2.5 rounded-xl text-white group-hover:scale-105 transition-transform shadow-lg shadow-slate-200">
                        <GraduationCap size={24} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm md:text-xl font-black text-slate-900 uppercase tracking-tighter leading-none group-hover:text-emerald-600 transition-colors">Exam Portal</span>
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Smart Seating Management</span>
                    </div>
                </Link>
                <div className="flex items-center gap-2 md:gap-4">
                    <NavLink href="/live" active={isActive('/live')} icon={<Radio size={18} className={isActive('/live') ? 'text-white' : 'text-emerald-500 animate-pulse'} />}>Live</NavLink>
                    <NavLink href="/admin" active={isActive('/admin')} icon={<LayoutDashboard size={18} />}>Admin</NavLink>
                    <NavLink href="/student" active={isActive('/student')} icon={<Search size={18} />}>Student</NavLink>

                    {user && (
                        <div className="relative ml-2">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 p-2 rounded-xl border border-slate-200 transition-all"
                            >
                                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                    {user.username?.[0] || 'S'}
                                </div>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showProfileMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 origin-top-right"
                                        >
                                            <div className="p-4 border-b border-slate-50 mb-2">
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Student Account</p>
                                                <p className="text-sm font-black text-slate-900 truncate">{user.full_name || user.username}</p>
                                                <p className="text-[10px] font-medium text-slate-500 truncate">{user.email}</p>
                                            </div>

                                            <Link
                                                href="/student/profile"
                                                onClick={() => setShowProfileMenu(false)}
                                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-emerald-600 transition-all group"
                                            >
                                                <User size={18} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                                <span className="font-bold text-sm">View Profile</span>
                                            </Link>

                                            <button
                                                onClick={handleLogout}
                                                disabled={isSigningOut}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-slate-700 hover:text-red-600 transition-all group disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {isSigningOut ? (
                                                    <div className="w-5 h-5 flex items-center justify-center">
                                                        <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                                                    </div>
                                                ) : (
                                                    <LogOut size={18} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                                                )}
                                                <span className="font-bold text-sm">{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

function NavLink({ href, children, active, icon }) {
    return (
        <Link href={href} className={`relative px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all duration-200 uppercase tracking-wide border
            ${active
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'text-slate-600 border-transparent hover:bg-slate-50 hover:text-emerald-600'}
        `}>
            <span>{icon}</span>
            <span className="hidden xs:inline">{children}</span>
        </Link>
    );
}
