'use client';
import { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Download, X, AlertTriangle, CheckSquare, Square, RefreshCcw } from 'lucide-react';
import { API_BASE_URL } from '@/utils/config';

export default function MalpracticeReportModal({ exam, onClose }) {
    const [loading, setLoading] = useState(null);
    const [entries, setEntries] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [selectedIds, setSelectedIds] = useState(new Set());

    useEffect(() => {
        fetchEntries();
    }, [exam.id]);

    const fetchEntries = async () => {
        setFetching(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/exams/${exam.id}/malpractice`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
                // Default: Select ALL
                setSelectedIds(new Set(data.map(e => e.id)));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleAll = () => {
        if (selectedIds.size === entries.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(entries.map(e => e.id)));
        }
    };

    const handleDownload = async (format) => {
        if (selectedIds.size === 0) {
            alert("Please select at least one student to download.");
            return;
        }

        setLoading(format);
        try {
            const token = localStorage.getItem('token');
            const idsParam = Array.from(selectedIds).join(',');
            const url = `${API_BASE_URL}/api/exams/${exam.id}/malpractice/${format}?ids=${idsParam}`;
            console.log(`Downloading from: ${url}`);

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error('Download Error response:', errText);
                throw new Error(`Download failed: ${res.status} ${res.statusText} - ${errText}`);
            }

            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `${exam.name}_Malpractice.${format === 'excel' ? 'xlsx' : 'pdf'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            alert(`Failed to download report: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="bg-amber-50 p-6 border-b border-amber-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                            <AlertTriangle className="text-amber-600" /> Malpractice Reports
                        </h2>
                        <p className="text-amber-700/70 text-sm mt-1 font-medium">{exam.name}</p>
                    </div>
                    <button onClick={onClose} className="text-amber-800/50 hover:text-amber-800 transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-auto">
                    {fetching ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p>No malpractice entries found for this exam.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <button
                                    onClick={toggleAll}
                                    className="text-sm font-semibold text-slate-600 hover:text-amber-600 flex items-center gap-2"
                                >
                                    {selectedIds.size === entries.length ? <CheckSquare size={18} className="text-amber-600" /> : <Square size={18} />}
                                    Select All ({entries.length})
                                </button>
                                <span className="text-sm text-slate-500">
                                    {selectedIds.size} Selected
                                </span>
                            </div>

                            <div className="border rounded-lg divide-y bg-slate-50">
                                {entries.map(entry => {
                                    const isSelected = selectedIds.has(entry.id);
                                    return (
                                        <div
                                            key={entry.id}
                                            onClick={() => toggleSelection(entry.id)}
                                            className={`p-3 flex items-start gap-3 cursor-pointer transition hover:bg-amber-50 ${isSelected ? 'bg-amber-50/50' : ''}`}
                                        >
                                            <div className={`mt-1 text-amber-600 transition ${isSelected ? 'opacity-100' : 'opacity-30'}`}>
                                                {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <span className="font-bold text-slate-800">{entry.student_reg}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${entry.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                                        entry.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {entry.severity}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{entry.reason}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t flex gap-4 shrink-0">
                    <button
                        onClick={() => handleDownload('excel')}
                        disabled={loading !== null || selectedIds.size === 0}
                        className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-50 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading === 'excel' ? <div className="animate-spin w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full" /> : <FileSpreadsheet size={18} />}
                        <span className="font-bold">Download Excel</span>
                    </button>

                    <button
                        onClick={() => handleDownload('pdf')}
                        disabled={loading !== null || selectedIds.size === 0}
                        className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border border-red-200 text-red-700 rounded-xl hover:bg-red-50 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading === 'pdf' ? <div className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full" /> : <FileText size={18} />}
                        <span className="font-bold">Download PDF</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
