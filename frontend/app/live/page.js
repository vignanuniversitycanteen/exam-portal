'use client';
import Navbar from '../../components/Navbar';
import PublishedExams from '../../components/PublishedExams';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';

export default function LivePage() {
    return (
        <div className="min-h-screen font-sans selection:bg-slate-900 selection:text-white flex flex-col bg-slate-50 text-slate-900">
            <Navbar />

            <main className="flex-grow pt-24 pb-20">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight uppercase">Live & Upcoming Sessions</h1>
                            <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg">
                                Detailed schedule of currently active and upcoming examinations.
                                <br />Check your batches, seating plans, date, time, and academic year details here.
                            </p>
                        </motion.div>
                    </div>
                </div>

                <div className="container mx-auto px-6">
                    <PublishedExams />
                </div>
            </main>

            <Footer />
        </div>
    );
}
