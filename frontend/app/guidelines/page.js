'use client';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, CheckSquare, AlertTriangle } from 'lucide-react';

export default function GuidelinesPage() {
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
                                <ClipboardList size={14} />
                                Student Handbook
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Examination Guidelines</h1>
                            <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
                                Essential rules and instructions for a smooth examination experience. Please review them prior to every session.
                            </p>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 space-y-12"
                    >
                        {/* Reporting Time */}
                        <div className="flex gap-6 md:gap-8 items-start">
                            <div className="p-4 rounded-2xl bg-slate-50 text-slate-900 shrink-0">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Reporting Time</h3>
                                <p className="text-slate-500 leading-relaxed mb-4">
                                    Students must be seated in the examination hall at least <strong>15 minutes</strong> before the scheduled start time. Late entry up to 30 minutes may be permitted only with authorization from the Chief Superintendent.
                                </p>
                                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold inline-block">
                                    No entry allowed after 30 minutes.
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-100"></div>

                        {/* ID Cards */}
                        <div className="flex gap-6 md:gap-8 items-start">
                            <div className="p-4 rounded-2xl bg-slate-50 text-slate-900 shrink-0">
                                <CheckSquare size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Identity Verification</h3>
                                <p className="text-slate-500 leading-relaxed">
                                    A valid <strong>University ID Card</strong> and <strong>Hall Ticket</strong> are mandatory for entry. Digital copies are NOT accepted unless explicitly authorized due to loss of physical card (Special Permission required).
                                </p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-100"></div>

                        {/* Prohibitions */}
                        <div className="flex gap-6 md:gap-8 items-start">
                            <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Prohibited Items</h3>
                                <p className="text-slate-500 leading-relaxed mb-2">
                                    The following items are strictly banned inside the hall:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-medium text-slate-600">
                                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Mobile Phones</span>
                                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Smart Watches</span>
                                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Bluetooth Devices</span>
                                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Programmable Calculators</span>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
