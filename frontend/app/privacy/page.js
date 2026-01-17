'use client';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { Lock, Eye, Database, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen font-sans selection:bg-slate-900 selection:text-white flex flex-col bg-slate-50 text-slate-900">
            <Navbar />

            <main className="flex-grow pt-24 pb-20">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="mb-16 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
                                <Lock size={14} />
                                Data Protection
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Privacy Policy</h1>
                            <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
                                We value your trust. Learn how we collect, use, and protect your academic and personal data within the Exam Portal.
                            </p>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 space-y-12"
                    >
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Database size={20} /></div>
                                1. Information We Collect
                            </h2>
                            <p className="text-slate-500 leading-relaxed mb-4">
                                The Exam Portal collects minimal personal data required for examination administration, including:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-500 marker:text-emerald-500">
                                <li><strong>Student Identity:</strong> Name, Register Number, Branch, and Academic Year.</li>
                                <li><strong>Academic Data:</strong> Enrolled courses, subject registrations, and examination schedules.</li>
                                <li><strong>System Logs:</strong> IP addresses and access timestamps for security auditing.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><Eye size={20} /></div>
                                2. How We Use Your Data
                            </h2>
                            <p className="text-slate-500 leading-relaxed">
                                Your data is used exclusively for:
                                <br />• Generating seating plans and hall tickets.
                                <br />• Tracking attendance during examinations.
                                <br />• Publishing results and academic records.
                                <br />• Notifying students of schedule changes.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><ShieldCheck size={20} /></div>
                                3. Data Security & Sharing
                            </h2>
                            <p className="text-slate-500 leading-relaxed font-medium bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                We implement strict security measures to protect your data. We do <strong>not</strong> sell or share student data with third-party advertisers. Data is accessible only to authorized university faculty and examination cell staff.
                            </p>
                        </section>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
