'use client';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, Search, Filter, Trash2, Edit2,
    Plus, Save, X, FileWarning, Loader2, ChevronDown,
    FileSpreadsheet, FileText, CheckSquare, Square, Download,
    ShieldAlert, Calendar, User, Info, MapPin
} from 'lucide-react';
import VisualRoomLayout from '../../components/VisualRoomLayout';
import MalpracticeModal from '../../components/MalpracticeModal';
import { API_BASE_URL } from '../../utils/config';

export default function MalpracticePage() {
    const [entries, setEntries] = useState([]);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [downloading, setDownloading] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [selectedExam, setSelectedExam] = useState('');


    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const perms = JSON.parse(localStorage.getItem('permissions') || '[]');

        if (!token) {
            window.location.href = '/admin/login';
            return;
        }

        if (role !== 'main_admin' && !perms.includes('malpractice_entry')) {
            alert('Access Denied: You do not have permission to manage Malpractice records.');
            window.location.href = '/admin';
            return;
        }

        fetchData();
        fetchExams();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/malpractice`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchExams = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/exams`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setExams(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDownload = async (format) => {
        setDownloading(format);
        try {
            const token = localStorage.getItem('token');
            const idsParam = selectedIds.size > 0 ? Array.from(selectedIds).join(',') : '';

            let url = `${API_BASE_URL}/api/malpractice/${format === 'excel' ? 'download' : 'pdf'}`;
            const params = new URLSearchParams();
            if (idsParam) params.append('ids', idsParam);
            else if (selectedExam) params.append('exam_id', selectedExam);

            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `Malpractice_Report_${new Date().getTime()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);
            } else {
                const errText = await res.text();
                console.error('Download Error:', errText);
                alert(`Failed to download report: ${res.status} ${res.statusText}. ${errText}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Download failed: ${err.message}`);
        } finally {
            setDownloading(null);
        }
    };

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredEntries.length && filteredEntries.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredEntries.map(e => e.id)));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/malpractice/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setEntries(entries.filter(e => e.id !== id));
            }
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const openModal = (entry = null) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEntry(null);
    };

    const filteredEntries = entries.filter(e => {
        const matchesSearch = e.student_reg.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.Exam?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesExam = selectedExam ? e.exam_id == selectedExam : true;
        return matchesSearch && matchesExam;
    });

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900 selection:bg-rose-100 selection:text-rose-900">
            <Navbar />

            {/* Premium Header Section */}
            <div className="pt-28 pb-32 px-4 sm:px-6 lg:px-8 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4"
                            >
                                <ShieldAlert size={12} /> Institutional Integrity
                            </motion.div>
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
                                Malpractice <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">Registry</span>
                            </h1>
                            <p className="text-slate-400 font-bold mt-4 max-w-2xl text-lg leading-relaxed">
                                Maintaining academic standards through rigorous monitoring and transparent incident recording.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="flex bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-1">
                                <button
                                    onClick={() => handleDownload('excel')}
                                    disabled={downloading !== null}
                                    className="hover:bg-emerald-500/20 text-emerald-400 font-black py-3 px-6 rounded-xl flex items-center gap-2 transition disabled:opacity-50 group"
                                >
                                    {downloading === 'excel' ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} className="group-hover:scale-110 transition-transform" />}
                                    <span className="text-xs uppercase tracking-widest">Excel</span>
                                </button>
                                <button
                                    onClick={() => handleDownload('pdf')}
                                    disabled={downloading !== null}
                                    className="hover:bg-rose-500/20 text-rose-400 font-black py-3 px-6 rounded-xl flex items-center gap-2 transition disabled:opacity-50 group"
                                >
                                    {downloading === 'pdf' ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} className="group-hover:scale-110 transition-transform" />}
                                    <span className="text-xs uppercase tracking-widest">PDF</span>
                                </button>
                            </div>

                            <button
                                onClick={() => openModal()}
                                className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black py-4 px-8 rounded-2xl shadow-2xl shadow-rose-900/40 flex items-center gap-3 transition transform hover:-translate-y-1 active:scale-95 group"
                            >
                                <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-90 transition-transform">
                                    <Plus size={20} />
                                </div>
                                <span className="uppercase tracking-widest text-sm">New Record</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-grow px-4 sm:px-6 lg:px-8 pb-20 -mt-16 relative z-20">
                <div className="max-w-7xl mx-auto">
                    {/* Floating Toolbar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 backdrop-blur-xl p-4 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white mb-8 flex flex-col md:flex-row gap-4 items-center"
                    >
                        <div className="relative w-full md:w-72">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Filter size={18} />
                            </div>
                            <select
                                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-10 py-4 outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 font-black text-slate-700 appearance-none transition cursor-pointer text-sm tracking-tight"
                                value={selectedExam}
                                onChange={e => setSelectedExam(e.target.value)}
                            >
                                <option value="">Global Coverage</option>
                                {exams.map(exam => (
                                    <option key={exam.id} value={exam.id}>{exam.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                        </div>

                        <div className="relative flex-grow w-full">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Search size={22} strokeWidth={2.5} />
                            </div>
                            <input
                                type="text"
                                placeholder="Locate by Registration, Exam name, or Reason..."
                                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-14 pr-4 py-4 outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 transition text-slate-700 font-bold text-sm tracking-tight placeholder:text-slate-300"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <AnimatePresence>
                            {selectedIds.size > 0 && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2"
                                >
                                    {selectedIds.size} Selected
                                    <button onClick={() => setSelectedIds(new Set())} className="hover:scale-110 transition"><X size={14} /></button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Content Area */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="p-20 text-center bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                                <Loader2 className="animate-spin mx-auto mb-4 text-rose-500" size={48} />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Accessing Archives...</p>
                            </div>
                        ) : filteredEntries.length === 0 ? (
                            <div className="p-20 text-center bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                                <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                                    <ShieldAlert size={40} className="text-slate-200" />
                                </div>
                                <h3 className="text-slate-900 font-black text-2xl mb-2 tracking-tight">Registry Clean</h3>
                                <p className="text-slate-400 font-bold">No malpractice incidents match the current filter criteria.</p>
                            </div>
                        ) : (
                            <>
                                {/* Table View */}
                                <div className="hidden md:block bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                                                <th className="px-8 py-6 w-12 text-center">
                                                    <button onClick={toggleAll}>
                                                        {selectedIds.size === filteredEntries.length && filteredEntries.length > 0 ? <CheckSquare size={18} className="text-rose-500" /> : <Square size={18} />}
                                                    </button>
                                                </th>
                                                <th className="px-8 py-6">Student</th>
                                                <th className="px-8 py-6">Exam & Reason</th>
                                                <th className="px-8 py-6">Severity & Status</th>
                                                <th className="px-8 py-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredEntries.map(entry => (
                                                <tr key={entry.id} className="group hover:bg-slate-50/50 transition-all">
                                                    <td className="px-8 py-6 text-center">
                                                        <button onClick={() => toggleSelection(entry.id)}>
                                                            {selectedIds.has(entry.id) ? <CheckSquare size={18} className="text-rose-500" /> : <Square size={18} className="text-slate-200" />}
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="font-black text-sm">{entry.student_reg}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(entry.createdAt).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="font-black text-xs text-slate-700">{entry.Exam?.name || 'N/A'}</div>
                                                        <div className="text-[11px] text-slate-500 font-bold line-clamp-1">{entry.reason}</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase text-white ${entry.severity === 'Critical' ? 'bg-rose-500' : entry.severity === 'High' ? 'bg-orange-500' : 'bg-slate-900'
                                                            }`}>
                                                            {entry.severity}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => openModal(entry)} className="p-2 hover:bg-white hover:shadow-md rounded-lg transition text-slate-400 hover:text-rose-500"><Edit2 size={16} /></button>
                                                            <button onClick={() => handleDelete(entry.id)} className="p-2 hover:bg-white hover:shadow-md rounded-lg transition text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Premium Modal Component */}
            <AnimatePresence>
                {isModalOpen && (
                    <MalpracticeModal
                        exam={exams.find(e => e.id == (editingEntry ? editingEntry.exam_id : selectedExam))}
                        editingEntry={editingEntry}
                        onClose={() => {
                            setIsModalOpen(false);
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
}
