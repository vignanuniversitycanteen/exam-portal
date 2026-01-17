'use client';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Search, Users, Calendar, Clock, MapPin, Mail, FileText, Phone, GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
    return (
        <div className="min-h-screen font-sans selection:bg-slate-900 selection:text-white flex flex-col bg-white text-slate-900">
            <Navbar />

            <main className="flex-grow">
                {/* --- Hero Section --- */}
                <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
                    <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-8 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Smart Seating Portal
                            </div>

                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-tight mb-8 tracking-tighter">
                                Universal Examination <br className="hidden md:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Management System</span>
                            </h1>

                            <div className="flex items-center justify-center gap-2 mb-10">
                                <span className="h-px w-12 bg-emerald-500/30"></span>
                                <span className="text-emerald-600 font-black tracking-widest uppercase text-xs md:text-sm">Secure &bull; Real-Time &bull; Dynamic</span>
                                <span className="h-px w-12 bg-emerald-500/30"></span>
                            </div>

                            <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed mb-12">
                                Providing a seamless interface for seating plans, schedules, and hall allocations. Managed dynamically for both students and faculty.
                            </p>

                            <div className="flex flex-col sm:flex-row justify-center gap-5">
                                <Link href="/student" className="group relative px-8 py-4 bg-slate-900 text-white rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 font-bold text-lg flex items-center justify-center gap-3 overflow-hidden">
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <Search size={20} className="text-emerald-400" />
                                    <span className="relative">Search Seating</span>
                                    <ArrowRight size={18} className="text-white/70 group-hover:translate-x-1 transition-transform relative" />
                                </Link>
                                <Link href="/admin" className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-100 rounded-xl shadow-md hover:shadow-lg hover:border-slate-900 hover:-translate-y-1 transition-all duration-300 font-bold text-lg flex items-center justify-center gap-3">
                                    <ShieldCheck size={20} className="text-emerald-600" />
                                    <span>Faculty Login</span>
                                </Link>
                            </div>
                        </motion.div>
                    </div>

                    {/* Subtle Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
                        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-slate-900/5 rounded-full blur-3xl"></div>
                    </div>
                </section>

                {/* --- Live Exams Section --- */}
                <section className="bg-slate-50 py-24 border-y border-slate-200/60">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Live Sessions</h2>
                            <p className="text-slate-500 max-w-2xl mx-auto font-medium">Currently active and upcoming examination schedules. Click on a session to view detailed seating plans, Exam Date, Time, and Academic Year.</p>
                        </div>
                        <PublishedExams />
                    </div>
                </section>

                {/* --- Features/Info Grid --- */}
                <section className="py-24 bg-white container mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                        <FeatureCard
                            icon={<Users className="text-slate-900" size={32} />}
                            title="Student Centric"
                            desc="Instant access to hall numbers and seating plans with just a registration number."
                        />
                        <FeatureCard
                            icon={<MapPin className="text-emerald-500" size={32} />}
                            title="Dynamic Visualization"
                            desc="Visual representation of exam halls helps students locate their seats effortlessly."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="text-slate-900" size={32} />}
                            title="Secure Administration"
                            desc="Robust tools for faculty to manage schedules, allocate rooms, and track attendance."
                        />
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

import PublishedExams from '../components/PublishedExams';

import Footer from '../components/Footer';

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center group">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-emerald-50 transition-all duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
                {desc}
            </p>
        </div>
    );
}
