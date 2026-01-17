'use client';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { FileText, Shield, AlertCircle, CheckCircle } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen font-sans selection:bg-slate-900 selection:text-white flex flex-col bg-slate-50 text-slate-900">
            <Navbar />

            <main className="flex-grow pt-24 pb-20">
                <div className="container mx-auto px-6 max-w-4xl">
                    {/* Header */}
                    <div className="mb-16 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
                                <FileText size={14} />
                                Legal Documentation
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Terms & Conditions</h1>
                            <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
                                Please read these terms carefully before using the Exam Portal. By accessing or using the service, you agree to be bound by these terms.
                            </p>
                        </motion.div>
                    </div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 space-y-12"
                    >
                        {/* Section 1 */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle size={20} /></div>
                                1. Acceptance of Terms
                            </h2>
                            <p className="text-slate-500 leading-relaxed">
                                By accessing and using this Examination Management Portal ("Portal"), you acknowledge that you have read, understood, and agree to comply with these Terms and Conditions. These terms apply to all students, faculty, and administrators who use the system.
                            </p>
                        </section>

                        {/* Section 2 */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Shield size={20} /></div>
                                2. Examination Rules & Conduct
                            </h2>
                            <div className="space-y-4 text-slate-500 leading-relaxed">
                                <p>
                                    All users must adhere to the university's examination code of conduct. The seating arrangements displayed on this portal are official and binding.
                                </p>
                                <ul className="list-disc pl-5 space-y-2 mt-2 marker:text-slate-300">
                                    <li>Students must verify their seat allocation at least 24 hours before the examination.</li>
                                    <li>Misrepresentation of identity or unauthorized access to the administration panel is strictly prohibited.</li>
                                    <li>Any discrepancy in the seating plan should be reported to the Examination Cell immediately.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 3 */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><AlertCircle size={20} /></div>
                                3. Accuracy of Information
                            </h2>
                            <p className="text-slate-500 leading-relaxed">
                                While we strive to ensure that all seating plans and schedules are accurate and up-to-date, last-minute changes due to administrative reasons may occur. The Examination Cell reserves the right to modify seating arrangements without prior online notification in emergency situations. Students are advised to check the physical notice boards as a secondary confirmation.
                            </p>
                        </section>

                        {/* Section 4 */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">
                                4. Privacy & Data Protection
                            </h2>
                            <p className="text-slate-500 leading-relaxed mb-4">
                                The portal collects and processes student academic data solely for the purpose of examination management. We are committed to protecting your privacy.
                            </p>
                            <p className="text-slate-500 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
                                "We do not share student data with third parties. All access is logged and monitored for security purposes."
                            </p>
                        </section>

                        <div className="w-full h-px bg-slate-100 my-8"></div>

                        <div className="text-center">
                            <p className="text-slate-400 text-sm font-medium">
                                Last Updated: <span className="text-slate-900 font-bold">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </p>
                            <p className="text-slate-400 text-sm mt-2">
                                For inquiries, contact <a href="mailto:COE@university.edu" className="text-emerald-600 hover:underline">COE@university.edu</a>
                            </p>
                        </div>

                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
