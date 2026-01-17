'use client';
import { useState, useEffect, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Hash, LayoutGrid, Loader2, CheckCircle, AlertCircle, Plus, Trash2, Layers, AlertTriangle, Monitor, Settings, Link2, FileSpreadsheet, FileText, GraduationCap, Type, Pencil, Lock, LogOut, User, X } from 'lucide-react';

import UserManagementModal from '../../components/UserManagementModal';
import ProfileModal from '../../components/ProfileModal';
import MalpracticeModal from '../../components/MalpracticeModal';
import MalpracticeReportModal from '../../components/MalpracticeReportModal';
import { API_BASE_URL } from '../../utils/config';

export default function AdminPage() {
    // --- State ---
    const [basicInfo, setBasicInfo] = useState({ name: '', academicYear: '', date: '', time: '', subjects: '' });
    const [editingExamId, setEditingExamId] = useState(null); // Track if editing
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // --- State: Batches & Rooms ---
    const [batches, setBatches] = useState([
        { id: 1, branch: '', section: '', year: '', subject: '', start_reg: '', end_reg: '', excluded_ids: [], color: 'bg-blue-50/80 border-blue-500 text-blue-900' }
    ]);
    const [rooms, setRooms] = useState([
        { id: 1, name: 'Hall A', rows: 8, cols: 6, disabled_seats: [], zone_config: {}, fill_strategy: 'col', prevent_adjacency: false, aisle_interval: 0, strict_flow: false }
    ]);
    const [activeRoomId, setActiveRoomId] = useState(1);

    // --- State: UI ---
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [paintMode, setPaintMode] = useState('block');
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const [permissions, setPermissions] = useState([]);
    const [showSessionExpired, setShowSessionExpired] = useState(false);
    const [malpracticeExam, setMalpracticeExam] = useState(null); // Exam for malpractice entry
    const [malpracticeReportExam, setMalpracticeReportExam] = useState(null); // Exam for malpractice report

    // --- Actions ---
    const fetchExams = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/exams?archived=${showArchived}`, {
                cache: 'no-store',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setExams(await res.json());
            else checkAuthError(res);
        } catch (err) { console.error(err); }
    };

    // Helper to check permission
    const hasPermission = (perm) => userRole === 'main_admin' || permissions.includes(perm);
    const canViewExams = hasPermission('create_exams') || hasPermission('edit_exams') || hasPermission('delete_exams') || hasPermission('archive_exams') || hasPermission('publish_exams') || hasPermission('download_attendance') || hasPermission('download_seating') || hasPermission('malpractice_entry');
    const canCreateOrEdit = editingExamId ? hasPermission('edit_exams') : hasPermission('create_exams');

    const checkAuthError = (res) => {
        if (res.status === 401 || res.status === 403) {
            setShowSessionExpired(true);
            return true;
        }
        return false;
    };

    // Auth Check
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const perms = JSON.parse(localStorage.getItem('permissions') || '[]');

        if (!token) {
            window.location.href = '/admin/login';
        } else {
            setIsAuthenticated(true);
            setUserRole(role);
            setPermissions(perms);
            fetchExams();
        }
    }, [showArchived]);

    // Premium Color Palette - Bright & Distinct (No Red)
    const batchColors = [
        { bg: 'bg-blue-50/80', border: 'border-blue-500', text: 'text-blue-900', ring: 'ring-blue-500' },
        { bg: 'bg-emerald-50/80', border: 'border-emerald-500', text: 'text-emerald-900', ring: 'ring-emerald-500' },
        { bg: 'bg-violet-50/80', border: 'border-violet-500', text: 'text-violet-900', ring: 'ring-violet-500' },
        { bg: 'bg-amber-50/80', border: 'border-amber-500', text: 'text-amber-900', ring: 'ring-amber-500' },
        { bg: 'bg-rose-50/80', border: 'border-rose-500', text: 'text-rose-900', ring: 'ring-rose-500' },
        { bg: 'bg-cyan-50/80', border: 'border-cyan-500', text: 'text-cyan-900', ring: 'ring-cyan-500' },
        { bg: 'bg-purple-50/80', border: 'border-purple-500', text: 'text-purple-900', ring: 'ring-purple-500' },
        { bg: 'bg-teal-50/80', border: 'border-teal-500', text: 'text-teal-900', ring: 'ring-teal-500' },
        { bg: 'bg-fuchsia-50/80', border: 'border-fuchsia-500', text: 'text-fuchsia-900', ring: 'ring-fuchsia-500' },
        { bg: 'bg-sky-50/80', border: 'border-sky-500', text: 'text-sky-900', ring: 'ring-sky-500' },
        { bg: 'bg-indigo-50/80', border: 'border-indigo-500', text: 'text-indigo-900', ring: 'ring-indigo-500' },
        { bg: 'bg-lime-50/80', border: 'border-lime-500', text: 'text-lime-900', ring: 'ring-lime-500' },
    ];

    // --- Effects ---
    useEffect(() => { fetchExams(); }, [showArchived]);

    const resetForm = () => {
        setBasicInfo({ name: '', academicYear: '', date: '', time: '', subjects: '' });
        setBatches([{ id: Date.now(), branch: '', section: '', year: '', subject: '', start_reg: '', end_reg: '', excluded_ids: [], color: 'bg-blue-50/80 border-blue-500 text-blue-900' }]);
        setRooms([{ id: Date.now(), name: 'Hall A', rows: 8, cols: 6, disabled_seats: [], zone_config: {}, fill_strategy: 'col', prevent_adjacency: false, aisle_interval: 0, strict_flow: false }]);
        setActiveRoomId(null);
        setEditingExamId(null);
        setPaintMode('block');
        setSelectedBatchId(null);
    };

    // Auto-dismiss notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // --- Computed Stats (Live Capacity Monitor) ---
    const stats = useMemo(() => {
        let totalStudents = 0;

        // Count totals
        batches.forEach(b => {
            const s = parseInt(b.start_reg.match(/\d+$/)?.[0]);
            const e = parseInt(b.end_reg.match(/\d+$/)?.[0]);
            if (!isNaN(s) && !isNaN(e) && e >= s) {
                const total = e - s + 1;
                const excludedCount = b.excluded_ids ? b.excluded_ids.length : 0;
                totalStudents += (total - excludedCount);
            }
        });

        let totalCapacity = 0;
        let totalEffectCapacity = 0;
        rooms.forEach(r => {
            const caps = r.rows * r.cols;
            totalCapacity += caps;
            totalEffectCapacity += (caps - r.disabled_seats.length);
        });

        return { totalStudents, totalCapacity, totalEffectCapacity };
    }, [batches, rooms]);

    // --- Actions ---


    const handleInfoChange = (e) => setBasicInfo({ ...basicInfo, [e.target.name]: e.target.value });

    const addBatch = () => {
        // Find the first color that is NOT currently used
        let selectedColor = null;
        for (const color of batchColors) {
            const isUsed = batches.some(b => b.color && b.color.includes(color.bg));
            if (!isUsed) {
                selectedColor = color;
                break;
            }
        }

        // Fallback: If all colors used, show error and stop
        if (!selectedColor) {
            setNotification({ type: 'error', message: 'Maximum batch limit reached! No unique colors available.' });
            return;
        }

        setBatches([...batches, {
            id: Date.now(), branch: '', section: '', year: '', subject: '', start_reg: '', end_reg: '', excluded_ids: [],
            color: `${selectedColor.bg} ${selectedColor.border} ${selectedColor.text}`
        }]);
    };

    const removeBatch = (id) => {
        if (batches.length > 1) setBatches(batches.filter(b => b.id !== id));
    };

    const handleBatchChange = (id, field, value) => {
        setBatches(batches.map(b => b.id === id ? { ...b, [field]: (field.includes('reg') ? value.toUpperCase() : value) } : b));
    };

    const addRoom = () => {
        const newId = Date.now();
        setRooms([...rooms, { id: newId, name: `Room ${rooms.length + 1}`, rows: 6, cols: 6, disabled_seats: [], zone_config: {}, fill_strategy: 'col', prevent_adjacency: false, aisle_interval: 0, strict_flow: false }]);
        setActiveRoomId(newId);
    };

    const removeRoom = (id) => {
        if (rooms.length > 1) {
            const newRooms = rooms.filter(r => r.id !== id);
            setRooms(newRooms);
            setActiveRoomId(newRooms[0].id);
        }
    };

    const handleRoomChange = (id, field, value) => {
        setRooms(rooms.map(r => {
            if (r.id === id) {
                const updated = { ...r, [field]: value };
                if (field === 'rows' || field === 'cols') {
                    updated.disabled_seats = [];
                    updated.zone_config = {};
                }
                // Ensure default props
                if (updated.prevent_adjacency === undefined) updated.prevent_adjacency = false;
                if (updated.strict_flow === undefined) updated.strict_flow = false;
                if (updated.aisle_interval === undefined) updated.aisle_interval = 0;
                if (!updated.fill_strategy) updated.fill_strategy = 'row';
                return updated;
            }
            return r;
        }));
    };

    const toggleExclusion = (batchId, regNo) => {
        setBatches(batches.map(b => {
            if (b.id === batchId) {
                const isExcluded = b.excluded_ids.includes(regNo);
                return {
                    ...b,
                    excluded_ids: isExcluded
                        ? b.excluded_ids.filter(id => id !== regNo)
                        : [...b.excluded_ids, regNo]
                };
            }
            return b;
        }));
    };

    // --- Seating Logic ---
    const handleSeatClick = (roomIndex, r, c) => {
        const newRooms = [...rooms];
        const room = newRooms[roomIndex];
        const seatId = `${r}-${c}`;

        if (paintMode === 'block') {
            if (room.disabled_seats.includes(seatId)) {
                room.disabled_seats = room.disabled_seats.filter(s => s !== seatId);
            } else {
                room.disabled_seats.push(seatId);
                if (room.zone_config[seatId] !== undefined) delete room.zone_config[seatId];
            }
        } else if (paintMode === 'zone') {
            if (selectedBatchId === null) return alert("Select a batch first!");
            const batchIndex = batches.findIndex(b => b.id === selectedBatchId);
            if (room.zone_config[seatId] === batchIndex) {
                delete room.zone_config[seatId];
            } else {
                room.zone_config[seatId] = batchIndex;
                room.disabled_seats = room.disabled_seats.filter(s => s !== seatId);
            }
        }
        setRooms(newRooms);
    };

    const toggleColumn = (roomIndex, col) => {
        const room = rooms[roomIndex];
        for (let r = 1; r <= room.rows; r++) handleSeatClick(roomIndex, r, col);
    };

    const toggleRow = (roomIndex, row) => {
        const room = rooms[roomIndex];
        for (let c = 1; c <= room.cols; c++) handleSeatClick(roomIndex, row, c);
    };

    // --- Simulation ---
    const seatingPreview = useMemo(() => {
        // 1. Deep copy batches to act as queues
        const batchQueues = {};
        batches.forEach((b, idx) => {
            batchQueues[idx] = [];
            const excludedSet = new Set(b.excluded_ids || []);

            if (b.start_reg && b.end_reg) {
                const prefix = b.start_reg.replace(/\d+$/, '');
                const start = parseInt(b.start_reg.match(/\d+$/)?.[0]);
                const end = parseInt(b.end_reg.match(/\d+$/)?.[0]);
                if (!isNaN(start) && !isNaN(end) && end >= start) {
                    const padLen = b.start_reg.match(/\d+$/)?.[0].length;
                    for (let i = start; i <= end; i++) {
                        const reg = `${prefix}${String(i).padStart(padLen, '0')}`;
                        if (!excludedSet.has(reg)) {
                            batchQueues[idx].push({ reg, batchId: b.id });
                        }
                    }
                }
            }
            // Explicit Sort to guarantee ascending order
            batchQueues[idx].sort((a, b) => a.reg.localeCompare(b.reg, undefined, { numeric: true }));
        });

        const map = {};

        rooms.forEach((room, rIdx) => {
            // Identify "Restricted Batches" for this room
            // A batch is restricted if it appears ANYWHERE in the zone_config for this room.
            const restrictedBatchIndices = new Set(Object.values(room.zone_config || {}));

            // Determine iteration order based on fill_strategy
            let seatOrder = [];
            if (room.fill_strategy === 'col') {
                // Column-major: Iterate Cols then Rows
                for (let c = 1; c <= room.cols; c++) {
                    for (let r = 1; r <= room.rows; r++) seatOrder.push({ r, c });
                }
            } else {
                // Row-major (Default): Iterate Rows then Cols
                for (let r = 1; r <= room.rows; r++) {
                    for (let c = 1; c <= room.cols; c++) seatOrder.push({ r, c });
                }
            }

            // Track allocations to check adjacency: [r-c] -> batchIndex
            const allocations = {};

            // Iterate through every seat in the defined order
            seatOrder.forEach(({ r, c }) => {
                const seatId = `${r}-${c}`;

                // Skip if blocked
                if (room.disabled_seats?.includes(seatId)) return;

                const zoneIdx = room.zone_config?.[seatId];
                let student = null;
                let allocatedBatchIndex = null;
                let studentBatchId = null;

                // --- ADJACENCY / STRICT FLOW CHECK ---
                let blockedBatches = new Set();

                if (room.prevent_adjacency) {
                    const isAisleInterval = room.aisle_interval > 0;

                    if (isAisleInterval && room.strict_flow) {
                        // STRICT MODE: Check ALL seats in the current "Bench"
                        const benchStartC = Math.floor((c - 1) / room.aisle_interval) * room.aisle_interval + 1;
                        for (let checkC = benchStartC; checkC < c; checkC++) {
                            const neighborBatch = allocations[`${r}-${checkC}`];
                            if (neighborBatch !== undefined) {
                                blockedBatches.add(neighborBatch);
                            }
                        }
                    } else {
                        // STANDARD MODE: Check only Left Neighbor
                        const leftC = c - 1;
                        const isAisleGap = isAisleInterval && (leftC % room.aisle_interval === 0);

                        if (leftC > 0 && !isAisleGap) {
                            const neighborBatch = allocations[`${r}-${leftC}`];
                            if (neighborBatch !== undefined) {
                                blockedBatches.add(neighborBatch);
                            }
                        }
                    }
                }

                if (zoneIdx !== undefined) {
                    // --- ZONED SEAT ---
                    // Strict Zone: ONLY this batch
                    // Conflict Check:
                    if (blockedBatches.has(zoneIdx)) {
                        student = null; // Conflict! Leave empty.
                    } else if (batchQueues[zoneIdx]?.length > 0) {
                        const next = batchQueues[zoneIdx].shift();
                        student = next.reg;
                        allocatedBatchIndex = zoneIdx;
                        studentBatchId = next.batchId;
                    }
                } else {
                    // --- UNZONED SEAT ---
                    for (const bIdx in batchQueues) {
                        const batchIndexNum = parseInt(bIdx);
                        if (restrictedBatchIndices.has(batchIndexNum)) continue; // SKIP restricted batches
                        if (blockedBatches.has(batchIndexNum)) continue; // SKIP conflicted batches

                        if (batchQueues[bIdx]?.length > 0) {
                            const next = batchQueues[bIdx].shift();
                            student = next.reg;
                            allocatedBatchIndex = batchIndexNum;
                            studentBatchId = next.batchId;
                            break; // Found a student
                        }
                    }
                }

                if (student) {
                    map[`${rIdx}-${r}-${c}`] = { student, batchId: studentBatchId };
                    allocations[`${r}-${c}`] = allocatedBatchIndex;
                }
            });
        });

        return map;
    }, [batches, rooms]); // Recalc on change

    // --- Submit ---
    // --- Submit ---
    const executeCreate = async () => {
        setLoading(true);
        try {
            const payload = {
                ...basicInfo,
                // Parse comma-separated subjects into array
                subjects: basicInfo.subjects ? basicInfo.subjects.split(',').map(s => s.trim()).filter(s => s) : [],
                // Aggregate all excluded IDs
                excluded_reg: batches.flatMap(b => b.excluded_ids || []),
                batches: batches.map(picked => ({ branch: picked.branch, section: picked.section, year: picked.year, subject: picked.subject, start_reg: picked.start_reg, end_reg: picked.end_reg })),
                room_config: rooms.map(r => ({
                    name: r.name,
                    rows: r.rows,
                    cols: r.cols,
                    disabled_seats: r.disabled_seats,
                    zone_config: r.zone_config,
                    fill_strategy: r.fill_strategy,
                    prevent_adjacency: r.prevent_adjacency,
                    aisle_interval: r.aisle_interval,
                    strict_flow: r.strict_flow
                }))
            };
            const url = editingExamId
                ? `${API_BASE_URL}/api/exams/${editingExamId}`
                : `${API_BASE_URL}/api/exams`;

            const res = await fetch(url, {
                method: editingExamId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const responseData = await res.json();
                setNotification({ message: editingExamId ? 'Exam Updated Successfully!' : 'Exam Created Successfully!', type: 'success' }); // Trigger Notification
                fetchExams();

                // Ask for auto-publish
                if (confirm(`Exam ${editingExamId ? 'updated' : 'created'}. Do you want to PUBLISH this exam to students now?`)) {
                    await executePublish(editingExamId || responseData.id);
                }

                resetForm(); // Reset form after success
            }
            else {
                if (!checkAuthError(res)) {
                    const d = await res.json();
                    setNotification({ type: 'error', message: d.error });
                }
            }
        } catch (e) { setNotification({ type: 'error', message: 'Server Failure' }); }
        finally { setLoading(false); setConfirmModal(null); }
    };

    // --- Actions (Edit / Archive) ---
    const handleEdit = (exam) => {
        setEditingExamId(exam.id);
        setBasicInfo({
            name: exam.name,
            academicYear: exam.academicYear || '',
            date: exam.date,
            time: exam.time,
            subjects: exam.subjects ? exam.subjects.join(', ') : ''
        });

        // Global exclusion list from DB
        const globalExcluded = new Set(exam.excluded_reg || []);

        // Restore Batches (Add IDs for UI keys)
        if (exam.batches && exam.batches.length > 0) {
            setBatches(exam.batches.map((b, i) => {
                // Determine exclusions for this batch
                const excludedForBatch = [];
                if (b.start_reg && b.end_reg) {
                    const prefix = b.start_reg.replace(/\d+$/, '');
                    const start = parseInt(b.start_reg.match(/\d+$/)?.[0]);
                    const end = parseInt(b.end_reg.match(/\d+$/)?.[0]);
                    const padLen = b.start_reg.match(/\d+$/)?.[0].length;

                    for (let k = start; k <= end; k++) {
                        const r = `${prefix}${String(k).padStart(padLen, '0')}`;
                        if (globalExcluded.has(r)) excludedForBatch.push(r);
                    }
                }

                return {
                    ...b,
                    id: Date.now() + i, // Generate temp ID
                    branch: b.branch || '',
                    year: b.year || '',
                    start_reg: b.start_reg || '',
                    end_reg: b.end_reg || '',
                    subject: b.subject || '',
                    section: b.section || '',
                    excluded_ids: excludedForBatch,
                    color: batchColors[i % batchColors.length].bg + ' ' + batchColors[i % batchColors.length].border + ' ' + batchColors[i % batchColors.length].text
                };
            }));
        }

        // Restore Rooms
        if (exam.room_config && exam.room_config.length > 0) {
            const newRooms = exam.room_config.map((r, i) => ({
                ...r,
                id: Date.now() + i + 100, // Generate temp ID
                name: r.name || `Room ${i + 1}`,
                rows: r.rows || 6,
                cols: r.cols || 6,
                disabled_seats: r.disabled_seats || [],
                zone_config: r.zone_config || {},
                fill_strategy: r.fill_strategy || 'row',
                prevent_adjacency: r.prevent_adjacency || false,
                aisle_interval: r.aisle_interval || 0,
                strict_flow: r.strict_flow || false
            }));
            setRooms(newRooms);
            setActiveRoomId(newRooms[0].id);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const executeArchive = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/exams/${id}/archive`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) checkAuthError(res);
            if (res.ok) {
                setNotification({ message: 'Exam Archived Successfully!', type: 'success' });
                fetchExams();
            }
        } catch (e) { }
        setConfirmModal(null);
    };

    const handleArchive = (id) => {
        const exam = exams.find(e => e.id === id);
        const isArchived = exam?.archived;

        setConfirmModal({
            title: isArchived ? 'Restore Exam?' : 'Archive Exam?',
            msg: isArchived
                ? 'This exam will be restored to the active list.'
                : 'This exam will be moved to the archive and hidden from the main list.',
            action: () => executeArchive(id),
            type: isArchived ? 'emerald' : 'info' // Use emerald for restore (positive), info for archive
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prepare Review Data
        const batchSummary = {};
        batches.forEach(b => {
            const s = parseInt(b.start_reg.match(/\d+$/)?.[0]);
            const e = parseInt(b.end_reg.match(/\d+$/)?.[0]);
            if (!isNaN(s) && !isNaN(e) && e >= s) {
                const count = e - s + 1;
                const key = `Batch ${batchSummary[b.branch] ? Object.keys(batchSummary).length + 1 : ''}`;
                // Simple aggregation by branch if possible, else list distinct
                if (!batchSummary[b.branch]) batchSummary[b.branch] = 0;
                batchSummary[b.branch] += count;
            }
        });

        const reviewData = {
            basic: basicInfo,
            stats: stats,
            batches: Object.entries(batchSummary).map(([k, v]) => ({ name: k, count: v })),
            rooms: rooms.map(r => ({ name: r.name, capacity: (r.rows * r.cols) - r.disabled_seats.length }))
        };

        setConfirmModal({
            title: 'Review & Confirm',
            msg: '', // Not used in review mode
            data: reviewData, // Pass rich data
            action: executeCreate,
            type: 'review'
        });
    };

    const executePublish = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/exams/${id}/publish`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setNotification({ message: 'Exam Published to Students!', type: 'success' });
                fetchExams();
            } else {
                checkAuthError(res);
            }
        } catch (e) { }
        setConfirmModal(null);
    };

    const handlePublish = (id) => {
        setConfirmModal({
            title: 'Publish Exam?',
            msg: 'Students will be able to see their seating arrangements immediately.',
            action: () => executePublish(id),
            type: 'info'
        });
    };

    const executeDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/exams/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setNotification({ message: 'Exam Deleted Successfully!', type: 'success' });
                fetchExams();
            }
            else { if (!checkAuthError(res)) setNotification({ type: 'error', message: 'Failed to delete' }); }
        } catch (e) { console.error(e); }
        setConfirmModal(null);
    };

    const handleDelete = (id) => {
        setConfirmModal({
            title: 'Delete Exam?',
            msg: 'Are you sure you want to delete this exam? This action cannot be undone.',
            action: () => executeDelete(id),
            type: 'danger'
        });
    };

    const handleMalpractice = (exam) => {
        setMalpracticeExam(exam);
    };

    const handleMalpracticeReport = (exam) => {
        setMalpracticeReportExam(exam);
    };

    if (!isAuthenticated) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            <Navbar />

            {/* --- Sticky Stats Bar --- */}
            <div className={`sticky top-0 z-30 transition-all duration-300 ${stats.totalStudents > stats.totalEffectCapacity
                ? 'bg-red-50 border-b border-red-200'
                : 'bg-white border-b border-slate-200 shadow-sm'
                }`}>
                <div className="container mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-2 text-xs md:text-sm font-medium relative">
                    <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-start">
                        {canCreateOrEdit && (
                            <>
                                <span className="flex items-center gap-2 text-slate-500">
                                    <div className="p-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                        <Users size={14} />
                                    </div>
                                    <span className="hidden xs:inline font-semibold">Total Students</span>
                                    <span className="text-slate-900 font-bold text-base ml-1">{stats.totalStudents}</span>
                                </span>
                                <span className="flex items-center gap-2 text-slate-500">
                                    <div className="p-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                        <LayoutGrid size={14} />
                                    </div>
                                    <span className="hidden xs:inline font-semibold">Total Seats</span>
                                    <span className={`font-bold text-base ml-1 ${stats.totalStudents > stats.totalEffectCapacity ? 'text-red-600' : 'text-slate-900'}`}>{stats.totalEffectCapacity}</span>
                                </span>
                            </>
                        )}
                        {/* Mobile Only Overflow Alert */}
                        {canCreateOrEdit && stats.totalStudents > stats.totalEffectCapacity && (
                            <span className="md:hidden flex items-center gap-1 text-red-600 font-bold animate-pulse">
                                <AlertTriangle size={14} /> <span className="text-[10px] uppercase">Overload</span>
                            </span>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            {mobileMenuOpen ? <X size={20} /> : <div className="space-y-1"><div className="w-5 h-0.5 bg-slate-600"></div><div className="w-5 h-0.5 bg-slate-600"></div><div className="w-5 h-0.5 bg-slate-600"></div></div>}
                        </button>
                    </div>

                    {/* Desktop Toolbar */}
                    <div className="hidden md:flex items-center gap-2">
                        {canCreateOrEdit && stats.totalStudents > stats.totalEffectCapacity && (
                            <span className="flex items-center gap-1 text-red-600 text-xs font-bold animate-pulse">
                                <AlertTriangle size={14} /> Over Capacity
                            </span>
                        )}
                        {canCreateOrEdit && <span className="text-slate-400 text-xs mr-2">Live Monitor</span>}

                        {hasPermission('manage_admins') && (
                            <button
                                onClick={() => setShowUserModal(true)}
                                className="bg-slate-900 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                Manage Admins
                            </button>
                        )}
                        {hasPermission('malpractice_entry') && (
                            <button
                                onClick={() => window.location.href = '/malpractice'}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm flex items-center gap-1 border border-amber-200"
                            >
                                <AlertTriangle size={14} /> Malpractice Registry
                            </button>
                        )}
                        <button
                            onClick={() => setShowProfileModal(true)}
                            className="bg-slate-100 hover:bg-white text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-md text-xs font-bold transition-colors border border-slate-200 flex items-center gap-1 shadow-sm"
                        >
                            <User size={14} /> My Profile
                        </button>
                        <button
                            onClick={() => { localStorage.removeItem('token'); window.location.href = '/admin/login'; }}
                            className="bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-md text-xs font-bold transition-colors border border-slate-200"
                        >
                            Logout
                        </button>
                    </div>

                    {/* Mobile Dropdown Menu */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl p-4 md:hidden flex flex-col gap-3 z-50"
                            >
                                {canCreateOrEdit && stats.totalStudents > stats.totalEffectCapacity && (
                                    <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                                        <AlertTriangle size={14} /> Capacity Exceeded by {stats.totalStudents - stats.totalEffectCapacity} students
                                    </div>
                                )}

                                {hasPermission('manage_admins') && (
                                    <button
                                        onClick={() => { setShowUserModal(true); setMobileMenuOpen(false); }}
                                        className="w-full text-left bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-sm flex items-center gap-3 active:scale-[0.98] transition-transform"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        Manage Admins
                                    </button>
                                )}
                                {hasPermission('malpractice_entry') && (
                                    <button
                                        onClick={() => { window.location.href = '/malpractice'; setMobileMenuOpen(false); }}
                                        className="w-full text-left bg-amber-50 text-amber-700 px-4 py-3 rounded-xl text-sm font-bold shadow-sm flex items-center gap-3 active:scale-[0.98] transition-transform border border-amber-100"
                                    >
                                        <AlertTriangle size={16} /> Malpractice Registry
                                    </button>
                                )}
                                <button
                                    onClick={() => { setShowProfileModal(true); setMobileMenuOpen(false); }}
                                    className="w-full text-left bg-slate-50 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold border border-slate-200 flex items-center gap-3 active:bg-slate-100"
                                >
                                    <User size={16} className="text-indigo-600" /> My Profile
                                </button>
                                <button
                                    onClick={() => { localStorage.removeItem('token'); window.location.href = '/admin/login'; }}
                                    className="w-full text-left bg-white text-red-600 px-4 py-3 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-3 hover:bg-red-50"
                                >
                                    <LogOut size={16} /> Logout
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="container mx-auto p-4 lg:p-8 flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 mt-2">
                {/* --- Left Column: Form --- */}
                {(editingExamId ? hasPermission('edit_exams') : hasPermission('create_exams')) ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-8 space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* 1. Exam Info */}
                            <section className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm mb-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <GraduationCap size={120} className="text-slate-900" />
                                </div>

                                <div className="relative z-10">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 pt-6 px-6">
                                        <GraduationCap className="text-emerald-600" /> Examination Details
                                    </h2>

                                    <div className="grid md:grid-cols-2 gap-6 px-6 pb-6">
                                        <div className="space-y-4">
                                            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider ml-1">Exam Name</label>
                                            <input
                                                name="name"
                                                value={basicInfo.name}
                                                onChange={handleInfoChange}
                                                placeholder="e.g. End Semester Examinations 2026"
                                                className="w-full pl-4 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all font-semibold text-slate-800 placeholder:text-slate-400 outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider ml-1">Academic Year</label>
                                            <input
                                                name="academicYear"
                                                value={basicInfo.academicYear}
                                                onChange={handleInfoChange}
                                                placeholder="e.g. 2025-2026"
                                                className="w-full pl-4 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all font-semibold text-slate-800 placeholder:text-slate-400 outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider ml-1">Date</label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={basicInfo.date}
                                                onChange={handleInfoChange}
                                                className="w-full pl-4 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all font-semibold text-slate-800 [color-scheme:light] outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider ml-1">Time</label>
                                            <input
                                                type="time"
                                                name="time"
                                                value={basicInfo.time}
                                                onChange={handleInfoChange}
                                                className="w-full pl-4 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all font-semibold text-slate-800 [color-scheme:light] outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-4 md:col-span-2">
                                            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider ml-1">Subjects (Comma Separated)</label>
                                            <input
                                                name="subjects"
                                                value={basicInfo.subjects}
                                                onChange={handleInfoChange}
                                                placeholder="e.g. M-1, Physics, Chemistry"
                                                className="w-full pl-4 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all font-semibold text-slate-800 placeholder:text-slate-400 outline-none"
                                            />
                                        </div>
                                    </div>
                                    {editingExamId && (
                                        <div className="mt-6 text-center">
                                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                                                <Pencil size={16} className="mr-2" /> Editing Mode
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </section>
                            {/* 2. Batches */}
                            <section className="bg-white border border-slate-200 p-5 md:p-6 rounded-2xl relative transition-colors shadow-sm">
                                <div className="flex justify-between items-center mb-5">
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                                        Student Batches
                                    </h2>
                                    <button type="button" onClick={addBatch} className="text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition flex items-center gap-1">
                                        <Plus size={14} /> Add Batch
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {batches.map((batch, idx) => (
                                            <motion.div
                                                key={batch.id}
                                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                className={`p-4 rounded-xl border-l-[4px] border-y border-r border-slate-200 relative group hover:shadow-md transition-all ${batch.color.replace('border-', 'border-l-')}`}
                                            >
                                                <div className="flex gap-4 items-start">
                                                    {/* Index Badge */}
                                                    <div className="w-8 h-8 rounded-lg bg-white/50 border border-black/5 flex items-center justify-center font-bold text-slate-500 shrink-0 text-xs shadow-sm mt-1">
                                                        {idx + 1}
                                                    </div>

                                                    {/* Inputs Grid */}
                                                    <div className="flex-1 grid grid-cols-12 gap-3">
                                                        {/* Branch & Section */}
                                                        <div className="col-span-12 md:col-span-4 grid grid-cols-2 gap-3">
                                                            <div className="col-span-1 border-r border-black/5 pr-3">
                                                                <FloatingInput
                                                                    label="Branch"
                                                                    list={`branch-options-${batch.id}`}
                                                                    value={batch.branch}
                                                                    onChange={(e) => handleBatchChange(batch.id, 'branch', e.target.value.toUpperCase())}
                                                                    placeholder="CSE"
                                                                />
                                                                <datalist id={`branch-options-${batch.id}`}>
                                                                    {['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'AI&DS', 'B.TECH', 'BBA', 'MBA', 'BCA', 'PHARMACY'].map(opt => (
                                                                        <option key={opt} value={opt} />
                                                                    ))}
                                                                </datalist>
                                                            </div>
                                                            <FloatingInput
                                                                label="Section"
                                                                value={batch.section}
                                                                onChange={(e) => handleBatchChange(batch.id, 'section', e.target.value.toUpperCase())}
                                                                placeholder="A"
                                                            />
                                                        </div>

                                                        {/* Year, Range, Subject */}
                                                        <div className="col-span-12 md:col-span-8 grid grid-cols-12 gap-3">
                                                            <div className="col-span-4">
                                                                <FloatingSelect
                                                                    label="Year"
                                                                    value={batch.year}
                                                                    onChange={(e) => handleBatchChange(batch.id, 'year', e.target.value)}
                                                                    options={['1st Year', '2nd Year', '3rd Year', '4th Year']}
                                                                    placeholder="Select Year"
                                                                />
                                                            </div>
                                                            <div className="col-span-8 grid grid-cols-2 gap-3">
                                                                <FloatingInput
                                                                    label="Start Reg"
                                                                    value={batch.start_reg}
                                                                    onChange={(e) => handleBatchChange(batch.id, 'start_reg', e.target.value)}
                                                                    placeholder="20L31A0501"
                                                                />
                                                                <FloatingInput
                                                                    label="End Reg"
                                                                    value={batch.end_reg}
                                                                    onChange={(e) => handleBatchChange(batch.id, 'end_reg', e.target.value)}
                                                                    placeholder="20L31A0560"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Optional Subject */}
                                                        <div className="col-span-12">
                                                            <FloatingInput
                                                                label="Subject (Optional)"
                                                                value={batch.subject}
                                                                onChange={(e) => handleBatchChange(batch.id, 'subject', e.target.value)}
                                                                placeholder="Enter subject if specific to this batch..."
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Delete Action */}
                                                    {batches.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeBatch(batch.id)}
                                                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                                            title="Remove Batch"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Preview & Exclusion Grid */}
                                                <div className="mt-4 pl-12 text-xs font-semibold text-slate-400">
                                                    {(() => {
                                                        const s = parseInt(batch.start_reg.match(/\d+$/)?.[0]);
                                                        const e = parseInt(batch.end_reg.match(/\d+$/)?.[0]);

                                                        if (s && e && e >= s) {
                                                            const prefix = batch.start_reg.replace(/\d+$/, '');
                                                            const padLen = batch.start_reg.match(/\d+$/)?.[0].length;

                                                            const total = e - s + 1;
                                                            const excludedCount = batch.excluded_ids ? batch.excluded_ids.length : 0;
                                                            const readyCount = total - excludedCount;

                                                            return (
                                                                <div className="flex flex-col gap-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-emerald-600 flex items-center gap-1">
                                                                            <CheckCircle size={10} /> {readyCount} Students ready
                                                                        </span>
                                                                        {excludedCount > 0 && <span className="text-red-500 text-[10px] font-bold">({excludedCount} Excluded)</span>}
                                                                    </div>

                                                                    {/* Visual Exclusion Grid */}
                                                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto w-full md:w-3/4">
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Select to Exclude (Red = Excluded)</p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {Array.from({ length: total }).map((_, i) => {
                                                                                const num = s + i;
                                                                                const reg = `${prefix}${String(num).padStart(padLen, '0')}`;
                                                                                const isExcluded = batch.excluded_ids && batch.excluded_ids.includes(reg);

                                                                                return (
                                                                                    <button
                                                                                        key={reg}
                                                                                        type="button"
                                                                                        onClick={() => toggleExclusion(batch.id, reg)}
                                                                                        title={reg}
                                                                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-all ${isExcluded
                                                                                            ? 'bg-red-500 text-white border-red-600'
                                                                                            : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                                                                            }`}
                                                                                    >
                                                                                        {String(num).padStart(3, '0').slice(-3)}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </section>

                            {/* 3. Room Designer (Tabbed) */}
                            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-colors">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                                        Room Layouts
                                    </h2>
                                    <button type="button" onClick={addRoom} className="text-xs font-bold bg-white border border-slate-200 shadow-sm text-slate-600 px-3 py-1.5 rounded-lg hover:text-emerald-600 transition flex items-center gap-1">
                                        <Plus size={14} /> Add Room
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex overflow-x-auto bg-slate-50/50 border-b border-slate-200 px-2 pt-2 scrollbar-hide">
                                    {rooms.map(room => (
                                        <button
                                            key={room.id} type="button" onClick={() => setActiveRoomId(room.id)}
                                            className={`px-5 py-2.5 text-sm font-bold rounded-t-lg transition-all relative ${activeRoomId === room.id ? 'bg-white text-indigo-600 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                        >
                                            {room.name}
                                            {activeRoomId === room.id && <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full"></div>}
                                        </button>
                                    ))}
                                </div>

                                {/* Active Editor */}
                                {rooms.map((room, rIdx) => {
                                    if (room.id !== activeRoomId) return null;
                                    return (
                                        <div key={room.id} className="p-6">
                                            {/* Toolbar */}
                                            <div className="flex flex-col gap-4 mb-6">
                                                {/* Top Row: Name & Delete */}
                                                <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Room Name</label>
                                                        <input
                                                            value={room.name}
                                                            onChange={(e) => handleRoomChange(room.id, 'name', e.target.value)}
                                                            className="font-bold text-2xl text-slate-800 bg-transparent border-none p-0 focus:ring-0 placeholder-slate-300 w-full"
                                                            placeholder="Enter Room Name"
                                                        />
                                                    </div>
                                                    {rooms.length > 1 && (
                                                        <button type="button" onClick={() => removeRoom(room.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all" title="Delete Room">
                                                            <Trash2 size={20} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Controls Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                                    {/* Col 1: Dimensions */}
                                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-2">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dimensions</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden w-fit shadow-sm">
                                                                <input type="number" min="1" max="20" value={room.rows} onChange={(e) => handleRoomChange(room.id, 'rows', parseInt(e.target.value) || 1)} className="w-12 text-center p-2 font-bold text-slate-700 bg-transparent outline-none border-r border-slate-100" />
                                                                <div className="bg-slate-50 px-2 text-slate-400 text-xs font-bold">×</div>
                                                                <input type="number" min="1" max="20" value={room.cols} onChange={(e) => handleRoomChange(room.id, 'cols', parseInt(e.target.value) || 1)} className="w-12 text-center p-2 font-bold text-slate-700 bg-transparent outline-none" />
                                                            </div>
                                                            <div className="flex gap-1 ml-auto">
                                                                {[5, 8, 10].map(s => (
                                                                    <button key={s} type="button" onClick={() => { handleRoomChange(room.id, 'rows', s); handleRoomChange(room.id, 'cols', s); }} className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-xs font-bold text-slate-400 flex items-center justify-center transition-all shadow-sm">
                                                                        {s}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Col 2: Flow Strategy */}
                                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-2">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fill Strategy</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRoomChange(room.id, 'fill_strategy', room.fill_strategy === 'col' ? 'row' : 'col')}
                                                            className={`flex-1 flex items-center justify-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm border ${room.fill_strategy === 'col' ? 'bg-white text-indigo-600 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                                        >
                                                            {room.fill_strategy === 'col' ? (
                                                                <>
                                                                    <div className="flex flex-col gap-0.5"><div className="w-4 h-1 bg-indigo-200 rounded-full"></div><div className="w-4 h-1 bg-indigo-500 rounded-full"></div><div className="w-4 h-1 bg-indigo-200 rounded-full"></div></div>
                                                                    Column-wise
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="flex gap-0.5"><div className="w-1 h-3 bg-slate-300 rounded-full"></div><div className="w-1 h-3 bg-slate-500 rounded-full"></div><div className="w-1 h-3 bg-slate-300 rounded-full"></div></div>
                                                                    Row-wise
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* Col 3: Rules & Constraints */}
                                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-2">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rules</span>
                                                        <div className="flex flex-col gap-2">
                                                            <label className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg border transition-all ${room.prevent_adjacency ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${room.prevent_adjacency ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-transparent'}`}>
                                                                    <CheckCircle size={14} />
                                                                </div>
                                                                <input type="checkbox" checked={room.prevent_adjacency} onChange={(e) => handleRoomChange(room.id, 'prevent_adjacency', e.target.checked)} className="hidden" />
                                                                <span className={`text-xs font-bold ${room.prevent_adjacency ? 'text-indigo-700' : 'text-slate-500'}`}>No Side-by-Side</span>
                                                            </label>

                                                            <div className="flex gap-2">
                                                                <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Aisle Gap:</span>
                                                                    <input type="number" min="0" max="10" value={room.aisle_interval} onChange={(e) => handleRoomChange(room.id, 'aisle_interval', parseInt(e.target.value) || 0)} className="w-full bg-transparent font-bold text-xs outline-none text-slate-700" placeholder="0" />
                                                                </div>

                                                                {room.aisle_interval > 0 && room.prevent_adjacency && (
                                                                    <label
                                                                        className={`cursor-pointer px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all shadow-sm select-none ${room.strict_flow ? 'bg-rose-50 border-rose-200 text-rose-700 ring-1 ring-rose-200' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 opacity-60 hover:opacity-100'}`}
                                                                        title="Strict Unique Mode: No repeated branches in a bench"
                                                                    >
                                                                        <input type="checkbox" checked={room.strict_flow} onChange={(e) => handleRoomChange(room.id, 'strict_flow', e.target.checked)} className="hidden" />

                                                                        {/* Custom Radio/Toggle UI */}
                                                                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center transition-all ${room.strict_flow ? 'bg-rose-600 border-rose-600' : 'border-slate-300'}`}>
                                                                            {room.strict_flow && <div className="w-1 h-1 bg-white rounded-full shadow-sm"></div>}
                                                                        </div>

                                                                        <span className="text-[10px] font-extrabold uppercase tracking-wide">Unique</span>
                                                                    </label>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Painter Tools */}
                                            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl shadow-inner border mb-4">
                                                <button type="button" onClick={() => { setPaintMode('block'); setSelectedBatchId(null); }} className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${paintMode === 'block' ? 'bg-red-500 text-white shadow-lg scale-105' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
                                                    <span className="w-3 h-3 rounded bg-red-400 border border-red-500"></span> Block Seat
                                                </button>
                                                <div className="w-px bg-slate-300 my-1"></div>
                                                {batches.map(b => (
                                                    <button key={b.id} type="button" onClick={() => { setPaintMode('zone'); setSelectedBatchId(b.id); }} className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${selectedBatchId === b.id && paintMode === 'zone' ? 'bg-white shadow-sm scale-105 ring-1 ring-slate-100' : 'text-slate-400 hover:bg-slate-200'}`}>
                                                        <span className={`w-2 h-2 rounded-full ${b.color.split(' ')[0]} border ${b.color.split(' ')[1]}`} /> {b.branch}{b.section ? `-${b.section}` : ''}
                                                    </button>
                                                ))}
                                            </div>

                                            {rooms.length > 1 && <button type="button" onClick={() => removeRoom(room.id)} className="text-slate-300 hover:text-red-500 transition"><Trash2 size={20} /></button>}


                                            {/* Canvas */}
                                            {/* Canvas - PURE WHITE BACKGROUND */}
                                            {/* Canvas */}
                                            {/* Canvas - PURE WHITE BACKGROUND */}
                                            {/* Removed items-center to fix mobile clipping, added internal wrapper for centering */}
                                            <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-8 flex flex-col overflow-x-auto min-h-[300px] relative w-full">
                                                <div className="w-fit mx-auto">
                                                    {/* Column Headers - Reversed */}
                                                    <div className="flex flex-row-reverse gap-1 mb-2">
                                                        {/* Spacer to align with Row Label (w-6 + ml-1) */}
                                                        <div className="w-6 ml-1 flex-shrink-0"></div>
                                                        {Array.from({ length: room.cols }).map((_, c) => {
                                                            const isAisleGap = room.aisle_interval > 0 && ((c + 1) % room.aisle_interval === 0) && (c + 1) !== room.cols;
                                                            return (
                                                                <button key={c} type="button" onClick={() => toggleColumn(rIdx, c + 1)} className={`w-6 h-6 md:w-9 md:h-6 flex items-center justify-center text-[9px] md:text-[10px] font-bold text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded transition ${isAisleGap ? 'ml-4 md:ml-8' : ''}`}>
                                                                    {c + 1}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Grid Row Container - Reversed */}
                                                    <div className="flex flex-col-reverse">
                                                        {Array.from({ length: room.rows }).map((_, r) => (
                                                            <div key={r} className="flex flex-row-reverse gap-1 mb-1 items-center">
                                                                {/* Row Label */}
                                                                <button type="button" onClick={() => toggleRow(rIdx, r + 1)} className="w-6 flex items-center justify-center text-[10px] md:text-xs font-bold text-slate-300 hover:text-indigo-500 hover:bg-slate-100 rounded transition ml-1">
                                                                    {String.fromCharCode(65 + r)}
                                                                </button>

                                                                {Array.from({ length: room.cols }).map((_, c) => {
                                                                    const seatId = `${r + 1}-${c + 1}`;
                                                                    const seatLabel = `${String.fromCharCode(65 + r)}${c + 1}`; // e.g. A1, B5
                                                                    const isBlocked = room.disabled_seats.includes(seatId);
                                                                    const zoneBatchIdx = room.zone_config[seatId];
                                                                    const previewReg = seatingPreview[`${rIdx}-${r + 1}-${c + 1}`];

                                                                    // IMAGE MATCH STYLE
                                                                    // Empty: Gray Outline (Requested "empty box label as greay color")
                                                                    let style = "bg-white border-[1.5px] border-slate-300 text-slate-300 hover:border-slate-400 hover:bg-slate-50 cursor-pointer shadow-sm";
                                                                    let content = <span className="text-[10px] font-bold">{c + 1}</span>;

                                                                    // Aisle Gap Visual
                                                                    const isAisleGap = room.aisle_interval > 0 && ((c + 1) % room.aisle_interval === 0) && (c + 1) !== room.cols;
                                                                    const marginClass = isAisleGap ? "ml-4 md:ml-8" : "";

                                                                    if (isBlocked) {
                                                                        // BLOCKED - RED (Requested "color red make it")
                                                                        style = "bg-red-50 border-red-100 text-red-300 cursor-not-allowed";
                                                                        content = <span className="text-[10px] opacity-60">✕</span>;
                                                                    } else if (previewReg) {
                                                                        const { student, batchId } = previewReg;
                                                                        let assignedBatch = batches.find(b => b.id === batchId);

                                                                        if (assignedBatch) {
                                                                            if (!assignedBatch.branch) {
                                                                                style = "bg-slate-100 border-slate-300 text-slate-400 font-bold shadow-sm";
                                                                            } else {
                                                                                const parts = assignedBatch.color.split(' ');
                                                                                const bg = parts[0];
                                                                                const border = parts[1];
                                                                                const text = parts[2];
                                                                                // STRICT Branch Color - Bright, Bold
                                                                                // Ensure RegNo is visible "in that box show reg.no"
                                                                                style = `${bg} ${border} ${text} font-bold shadow-md scale-105 ring-1 ring-white/50`;
                                                                            }
                                                                        }
                                                                        // Show Reg No (Last 3 digits for space)
                                                                        content = <span className="text-[9px] md:text-[10px] tracking-tight">{student.slice(-3)}</span>;
                                                                    } else if (zoneBatchIdx !== undefined) {
                                                                        // paintMode 'zone' stores Index in array
                                                                        const zoneBatch = batches[zoneBatchIdx];
                                                                        if (zoneBatch) {
                                                                            // Fix N/A color logic: Use the batch's actual color but lighter/dashed
                                                                            if (!zoneBatch.branch) {
                                                                                style = "bg-slate-50 border-dashed border-slate-300 text-slate-300 opacity-60";
                                                                            } else {
                                                                                const parts = zoneBatch.color.split(' ');
                                                                                const bg = parts[0];
                                                                                const border = parts[1];
                                                                                const text = parts[2];

                                                                                style = `${bg} ${border.replace('border-', 'border-dashed border-')} ${text} opacity-70`;
                                                                            }
                                                                            content = <span className="text-[8px] md:text-[9px] font-bold opacity-80">N/A</span>;
                                                                        }
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={seatId} type="button" onMouseDown={() => handleSeatClick(rIdx, r + 1, c + 1)}
                                                                            className={`w-6 h-6 md:w-9 md:h-9 rounded-md md:rounded-lg border-[1.5px] md:border-2 flex items-center justify-center transition-all duration-200 ${style} ${marginClass}`}
                                                                        >
                                                                            {content}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {/* Stage Visual - Matching Student View (Trapezoid) */}
                                                    <div className="mt-8 mb-6 w-full flex flex-col items-center">
                                                        <div className="relative w-full h-10 md:h-12 flex items-center justify-center">
                                                            {/* The Blue Shape */}
                                                            <div
                                                                className="absolute inset-0 bg-sky-100 border-t-4 border-sky-300 rounded-lg shadow-sm"
                                                                style={{
                                                                    perspective: '500px',
                                                                    transform: 'rotateX(20deg) scale(0.9)',
                                                                    boxShadow: '0 10px 20px -5px rgba(14, 165, 233, 0.15)'
                                                                }}
                                                            ></div>
                                                            <span className="relative z-10 text-[9px] md:text-[10px] font-black text-sky-400 uppercase tracking-[0.3em]">
                                                                Screen / Stage
                                                            </span>
                                                        </div>

                                                        {/* Legend */}
                                                        <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
                                                            {/* Dynamic Branches */}
                                                            {batches.map(batch => {
                                                                if (!batch.branch) return null;
                                                                return (
                                                                    <div key={batch.id} className="flex items-center gap-2">
                                                                        <div className={`w-5 h-5 rounded-md shadow-sm ${batch.color.split(' ')[0]} border ${batch.color.split(' ')[1]}`}></div>
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{batch.branch}</span>
                                                                    </div>
                                                                );
                                                            })}

                                                            {/* Seat (Empty) - Now Gray */}
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-md border-[1.5px] border-slate-300 bg-white shadow-sm"></div>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Empty</span>
                                                            </div>
                                                            {/* Blocked */}
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-md bg-slate-200 border border-slate-300 shadow-inner"></div>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Blocked</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right mt-2 text-xs text-slate-400 font-medium">Capacity: {(room.rows * room.cols) - room.disabled_seats.length} seats</div>
                                        </div>
                                    );
                                })}
                            </section>

                            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-slate-200 flex justify-center items-center gap-2">
                                {loading ? <Loader2 className="animate-spin" /> : (editingExamId ? 'Update Exam' : 'Create Exam & Generate')}
                            </button>
                            {
                                editingExamId && (
                                    <button type="button" onClick={resetForm} className="w-full mt-2 text-slate-400 text-sm font-bold hover:text-slate-600">Cancel Edit</button>
                                )
                            }
                        </form >
                    </motion.div >
                ) : (
                    <div className="lg:col-span-8 flex flex-col items-center justify-center p-10 bg-slate-50 border border-slate-200 rounded-xl border-dashed">
                        <Lock className="text-slate-300 mb-4" size={48} />
                        <h3 className="text-slate-500 font-bold">Exam Management Restricted</h3>
                        <p className="text-slate-400 text-sm">You do not have permission to create or edit exams.</p>
                    </div>
                )}

                {/* --- Right Column: Recents --- */}
                {/* --- Right Column: Recents --- */}
                {canViewExams && (
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex justify-between items-center bg-white border border-slate-200 shadow-sm p-4 rounded-2xl transition-colors">
                            <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2">
                                <Layers size={18} className={showArchived ? "text-amber-500" : "text-indigo-500"} />
                                {showArchived ? 'Archived Exams' : 'Recent Exams'}
                            </h3>
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition border ${showArchived ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}
                            >
                                {showArchived ? 'Show Active' : 'Show Archived'}
                            </button>
                        </div>
                        {
                            exams.map(exam => (
                                <ExamCard
                                    key={exam.id}
                                    exam={exam}
                                    handlePublish={handlePublish}
                                    handleDelete={handleDelete}
                                    handleEdit={handleEdit}
                                    handleArchive={handleArchive}
                                    handleMalpractice={handleMalpractice}
                                    handleMalpracticeReport={handleMalpracticeReport}
                                    setNotification={setNotification}
                                    hasPermission={hasPermission}
                                />
                            ))
                        }
                    </div >
                )}
            </div >


            {/* Notification Toast */}
            < AnimatePresence >
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                            {notification.type === 'success' ? <CheckCircle size={24} className="fill-current" /> : <AlertTriangle size={24} className="fill-current" />}
                            <div>
                                <h4 className="font-bold text-lg">{notification.type === 'success' ? 'Success' : 'Error'}</h4>
                                <p className="text-sm font-medium opacity-90">{notification.message}</p>
                            </div>
                        </div>
                    </motion.div>
                )
                }
            </AnimatePresence >

            {/* Confirmation Modal */}
            < AnimatePresence >
                {confirmModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setConfirmModal(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
                        >
                            <div className={`p-6 border-b ${confirmModal.type === 'danger' ? 'bg-red-50 border-red-100' : confirmModal.type === 'info' ? 'bg-indigo-50 border-indigo-100' : confirmModal.type === 'review' ? 'bg-slate-50 border-slate-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                <h3 className={`text-xl font-bold ${confirmModal.type === 'danger' ? 'text-red-700' : confirmModal.type === 'info' ? 'text-indigo-700' : confirmModal.type === 'review' ? 'text-slate-800' : 'text-emerald-700'}`}>
                                    {confirmModal.title}
                                </h3>
                            </div>

                            {confirmModal.type === 'review' ? (
                                <div className="p-6 space-y-5">
                                    {/* Basic Info */}
                                    <div className="flex items-center gap-4 text-sm text-slate-600 font-medium pb-4 border-b border-slate-100">
                                        <div className="flex items-center gap-2"><Calendar size={16} className="text-indigo-500" /> {confirmModal.data.basic.date}</div>
                                        <div className="flex items-center gap-2"><Clock size={16} className="text-indigo-500" /> {confirmModal.data.basic.time}</div>
                                    </div>

                                    {/* Capacity Status */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
                                            <span>Capacity Check</span>
                                            <span className={confirmModal.data.stats.totalStudents > confirmModal.data.stats.totalEffectCapacity ? "text-red-500" : "text-emerald-500"}>
                                                {confirmModal.data.stats.totalStudents > confirmModal.data.stats.totalEffectCapacity ? "OVER CAPACITY" : "GOOD"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-slate-800 font-bold">{confirmModal.data.stats.totalStudents} Students</span>
                                            <span className="text-slate-400 text-xs">vs</span>
                                            <span className="text-slate-800 font-bold">{confirmModal.data.stats.totalEffectCapacity} Seats</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${confirmModal.data.stats.totalStudents > confirmModal.data.stats.totalEffectCapacity ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(100, (confirmModal.data.stats.totalStudents / confirmModal.data.stats.totalEffectCapacity) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Summaries */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-2">Batches</label>
                                            <div className="space-y-1">
                                                {confirmModal.data.batches.slice(0, 3).map((b, i) => (
                                                    <div key={i} className="text-xs font-bold text-slate-700 flex justify-between">
                                                        <span>{b.name || 'Unknown'}</span>
                                                        <span className="bg-indigo-50 text-indigo-600 px-1.5 rounded">{b.count}</span>
                                                    </div>
                                                ))}
                                                {confirmModal.data.batches.length > 3 && <div className="text-[10px] text-slate-400 italic">+{confirmModal.data.batches.length - 3} more</div>}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-2">Rooms ({confirmModal.data.rooms.length})</label>
                                            <div className="space-y-1">
                                                {confirmModal.data.rooms.slice(0, 3).map((r, i) => (
                                                    <div key={i} className="text-xs font-bold text-slate-700 flex justify-between">
                                                        <span>{r.name}</span>
                                                        <span className="text-slate-400">{r.capacity}</span>
                                                    </div>
                                                ))}
                                                {confirmModal.data.rooms.length > 3 && <div className="text-[10px] text-slate-400 italic">+{confirmModal.data.rooms.length - 3} more</div>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 justify-end pt-2">
                                        <button
                                            onClick={() => setConfirmModal(null)}
                                            className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={confirmModal.action}
                                            className="px-6 py-2.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-black shadow-lg shadow-slate-200 transition transform active:scale-95"
                                        >
                                            Confirm & Create
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6">
                                    <p className="text-slate-600 font-medium mb-6">{confirmModal.msg}</p>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => setConfirmModal(null)}
                                            className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmModal.action}
                                            className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95 ${confirmModal.type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : confirmModal.type === 'info' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'}`}
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >
            {showUserModal && <UserManagementModal onClose={() => setShowUserModal(false)} />}
            {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
            {malpracticeExam && <MalpracticeModal exam={malpracticeExam} onClose={() => setMalpracticeExam(null)} />}
            {malpracticeReportExam && <MalpracticeReportModal exam={malpracticeReportExam} onClose={() => setMalpracticeReportExam(null)} />}

            {/* Session Expired Modal */}
            <AnimatePresence>
                {showSessionExpired && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden text-center p-6"
                        >
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Session Expired</h3>
                            <p className="text-slate-500 text-sm mb-6">Your security token has expired. Please login again to continue managing exams.</p>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    window.location.href = '/admin/login';
                                }}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                            >
                                <LogOut size={18} /> Login Again
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    )
}



function ExamCard({ exam, handlePublish, handleDelete, handleEdit, handleArchive, handleMalpractice, handleMalpracticeReport, setNotification, hasPermission }) {
    const [selectedSubject, setSelectedSubject] = useState('');
    const query = selectedSubject ? `?subject=${encodeURIComponent(selectedSubject)}` : '';

    const handleDownload = async (e, type) => {
        e.preventDefault();

        let endpoint;
        let confirmMsg;
        let filename = `${exam.name}_Start`;

        if (type === 'seating') {
            endpoint = `/api/exams/${exam.id}/pdf/seating${query}`;
            confirmMsg = `Download Seating Chart (PDF) for ${exam.name}?`;
            filename = `${exam.name}_Seating.pdf`;
        } else if (type === 'attendance-excel') {
            endpoint = `/api/exams/${exam.id}/excel/attendance${query}`;
            confirmMsg = `Download Attendance Sheet (Excel) for ${exam.name}?`;
            filename = `${exam.name}_Attendance.xlsx`;
        } else if (type === 'attendance-pdf') {
            endpoint = `/api/exams/${exam.id}/pdf/attendance${query}`;
            confirmMsg = `Download Attendance Sheet (PDF) for ${exam.name}?`;
            filename = `${exam.name}_Attendance.pdf`;
        }

        if (!confirm(confirmMsg)) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Download failed');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename; // Try to use filename or let server Content-Disposition handle it if possible, but manual is safer here
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            console.error(err);
            alert(`Download Error: ${err.message}`);
        }
    };

    const handleCopyLink = () => {
        // Generate link based on exam name and date
        const link = `${window.location.origin}/student?exam=${encodeURIComponent(exam.name)}&date=${exam.date}`;
        navigator.clipboard.writeText(link);
        if (setNotification) setNotification({ type: 'success', message: 'Exam link copied to clipboard!' });
        setTimeout(() => setNotification && setNotification(null), 3000);
    };

    return (
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl relative overflow-hidden group transition-all">
            <div className="flex flex-col-reverse gap-4 mb-4">
                <div>
                    <h4 className="font-bold text-slate-800 text-lg leading-tight mb-2">{exam.name}</h4>
                    <div className="flex flex-col gap-1.5 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-2"><Calendar size={12} className="text-slate-400" /> <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Date:</span> {new Date(exam.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-2"><Clock size={12} className="text-slate-400" /> <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Time:</span> {exam.time}</span>
                        <span className="flex items-center gap-2"><GraduationCap size={12} className="text-slate-400" /> <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Academic Year:</span> {exam.academicYear || 'Not Set'}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center self-end md:self-auto">
                    {!exam.archived && hasPermission('edit_exams') && (
                        <button onClick={() => handleEdit(exam)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition border border-transparent hover:border-indigo-100" title="Edit">
                            <Settings size={14} />
                        </button>
                    )}
                    {exam.status === 'published' && !exam.archived && (
                        <button onClick={handleCopyLink} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-100" title="Copy Link">
                            <Link2 size={14} />
                        </button>
                    )}

                    {hasPermission('archive_exams') && (
                        <button onClick={() => handleArchive(exam.id)} className={`p-1.5 rounded-lg transition border border-transparent ${exam.archived ? 'text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-100'}`} title={exam.archived ? "Restore" : "Archive"}>
                            {exam.archived ? <CheckCircle size={14} /> : <Layers size={14} />}
                        </button>
                    )}
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${exam.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        {exam.status}
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                {exam.subjects && exam.subjects.length > 0 && (
                    <div className="mb-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Subject Filter</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="w-full text-xs font-bold border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-900 focus:bg-white outline-none"
                        >
                            <option value="">ALL SUBJECTS</option>
                            {exam.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                )}

                {exam.archived ? (
                    <div className="w-full bg-slate-100 text-slate-500 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed">
                        <Layers size={14} /> Archived (Read Only)
                    </div>
                ) : exam.status !== 'published' ? (
                    <button onClick={() => handlePublish(exam.id)} disabled={!hasPermission('publish_exams')} className={`w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-slate-200 flex items-center justify-center gap-2 ${!hasPermission('publish_exams') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Monitor size={14} /> Publish to Students
                    </button>
                ) : (
                    <div className="w-full bg-emerald-50 text-emerald-600 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 border border-emerald-100">
                        <CheckCircle size={14} /> Published
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    {hasPermission('download_seating') && (
                        <button onClick={(e) => handleDownload(e, 'seating')} className="col-span-2 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2.5 rounded-xl hover:bg-indigo-100 transition text-xs font-bold">
                            <LayoutGrid size={14} /> Seating Chart (PDF)
                        </button>
                    )}
                    {hasPermission('download_attendance') && (
                        <>
                            <button onClick={(e) => handleDownload(e, 'attendance-pdf')} className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-3 py-2.5 rounded-xl hover:bg-slate-200 transition text-xs font-bold">
                                <FileText size={14} /> Attendance (PDF)
                            </button>
                            <button onClick={(e) => handleDownload(e, 'attendance-excel')} className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2.5 rounded-xl hover:bg-emerald-100 transition text-xs font-bold">
                                <FileSpreadsheet size={14} /> Attendance (Excel)
                            </button>
                        </>
                    )}
                </div>
                {hasPermission('delete_exams') && (
                    <button onClick={() => handleDelete(exam.id)} className="w-full flex items-center justify-center gap-2 text-slate-300 hover:text-red-500 hover:bg-red-50 py-2 rounded-xl transition text-xs font-bold">
                        <Trash2 size={14} /> Delete Exam
                    </button>
                )}
                {hasPermission('malpractice_entry') && (
                    <div className="flex gap-2 w-full">
                        <button onClick={() => handleMalpractice(exam)} className="flex-1 flex items-center justify-center gap-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 py-2 rounded-xl transition text-xs font-bold">
                            <AlertTriangle size={14} /> Entry
                        </button>
                        <button onClick={() => handleMalpracticeReport(exam)} className="flex-1 flex items-center justify-center gap-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 py-2 rounded-xl transition text-xs font-bold border-l border-slate-100">
                            <FileSpreadsheet size={14} /> Reports
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Floating Label Components for Batch Designer ---
function FloatingInput({ label, className = "", ...props }) {
    return (
        <div className="relative group">
            <input
                {...props}
                placeholder=" " // Required for peer-placeholder-shown trick
                className={`peer w-full h-10 px-3 bg-white border border-slate-200 rounded-lg outline-none text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${className}`}
            />
            <label className="absolute left-2.5 -top-2 bg-white px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-slate-400 peer-focus:-top-2 peer-focus:text-indigo-600 pointer-events-none">
                {label}
            </label>
        </div>
    );
}

function FloatingSelect({ label, options, className = "", ...props }) {
    return (
        <div className="relative group">
            <select
                {...props}
                className={`peer w-full h-10 px-3 bg-white border border-slate-200 rounded-lg outline-none text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer ${className}`}
            >
                <option value="" disabled hidden></option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <label className="absolute left-2.5 -top-2 bg-white px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-slate-400 peer-focus:-top-2 peer-focus:text-indigo-600 pointer-events-none">
                {label}
            </label>
        </div>
    );
}


