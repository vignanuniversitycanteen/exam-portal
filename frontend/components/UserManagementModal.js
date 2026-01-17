'use client';
import { useState, useEffect } from 'react';
import { Shield, Trash2, Key, UserPlus, X, Loader2, Lock, CheckCircle, Smartphone, RefreshCw, AlertTriangle } from 'lucide-react';
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

export default function UserManagementModal({ onClose }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [newUser, setNewUser] = useState({ username: '', employee_id: '', password: '', admin_password: '', role: 'sub_admin' });
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    // Edit/View Permissions Mode
    const [editingUser, setEditingUser] = useState(null);

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setUsers(await res.json());
        } catch (e) { setError('Failed to load users'); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Permanently delete this admin?')) return;
        try {
            await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setUsers(users.filter(u => u.id !== id));
        } catch (e) { alert('Failed to delete'); }
    };

    const handleResetMFA = async (id) => {
        if (!confirm('Reset MFA for this user? They will need to setup Google Authenticator again.')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}/reset-mfa`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                alert('MFA Reset Successfully');
                fetchUsers();
            }
        } catch (e) { alert('Failed to reset MFA'); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/create-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ ...newUser, permissions: selectedPermissions })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess(data.message);
                setNewUser({ username: '', employee_id: '', password: '', admin_password: '', role: 'sub_admin' });
                setSelectedPermissions([]); // Reset defaults
                setMobileTab('list'); // Switch to list view on mobile
                fetchUsers();
            } else {
                setError(data.error);
            }
        } catch (e) { setError('Server Error'); }
        finally { setSubmitting(false); }
    };

    const handleUpdatePermissions = async (userId, newPerms) => {
        try {
            await fetch(`${API_BASE_URL}/api/admin/users/${userId}/permissions`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ permissions: newPerms })
            });
            // fetchUsers(); // Removed to prevent race condition/flicker. Relies on optimistic update.
        } catch (e) { console.error(e); }
    };

    const togglePermission = (permId) => {
        if (selectedPermissions.includes(permId)) {
            setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
        } else {
            setSelectedPermissions([...selectedPermissions, permId]);
        }
    };

    const toggleEditPermission = (user, permId) => {
        const currentPerms = user.permissions || [];
        let newPerms;
        if (currentPerms.includes(permId)) newPerms = currentPerms.filter(p => p !== permId);
        else newPerms = [...currentPerms, permId];

        // Optimistic update: Update UI immediately
        setUsers(users.map(u => u.id === user.id ? { ...u, permissions: newPerms } : u));

        // Sync with server
        handleUpdatePermissions(user.id, newPerms);
    };



    // Auth Check for Edit Capabilities
    const canManagePermissions = () => {
        const role = localStorage.getItem('role');
        const perms = JSON.parse(localStorage.getItem('permissions') || '[]');
        return role === 'main_admin' || perms.includes('manage_permissions');
    };
    const canEdit = canManagePermissions();

    const [mobileTab, setMobileTab] = useState('list'); // 'list' or 'create'

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
            <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[100vh] md:max-h-[90vh]">

                {/* Mobile Tab Switcher */}
                <div className="flex md:hidden border-b border-slate-200 shrink-0">
                    <button
                        onClick={() => setMobileTab('list')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mobileTab === 'list' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500'}`}
                    >
                        <Shield size={16} /> Admins List
                    </button>
                    <button
                        onClick={() => setMobileTab('create')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mobileTab === 'create' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500'}`}
                    >
                        <UserPlus size={16} /> Create New
                    </button>
                    <button onClick={onClose} className="px-4 text-slate-400 hover:text-slate-800 border-l border-slate-200">
                        <X size={20} />
                    </button>
                </div>

                {/* LIST SECTION */}
                <div className={`flex-1 bg-slate-50 p-4 md:p-6 border-r border-slate-200 overflow-y-auto md:min-w-[350px] ${mobileTab === 'list' ? 'block' : 'hidden'} md:block`}>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Shield className="text-emerald-600" /> Existing Admins
                    </h2>

                    {loading ? <Loader2 className="animate-spin text-slate-400 mx-auto" /> : (
                        <div className="space-y-3">
                            {users.length === 0 ? <p className="text-slate-400 text-sm">No admins found.</p> : (
                                users.map(user => (
                                    <div key={user.id} className={`bg-white p-4 rounded-lg border shadow-sm transition-all hover:shadow-md ${user.role === 'main_admin' ? 'border-purple-200 bg-purple-50/20' : 'border-slate-200'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-slate-700">
                                                <div className="flex items-center gap-2">
                                                    {user.username}
                                                    {user.role === 'main_admin' && (
                                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-bold tracking-wider">MAIN ADMIN</span>
                                                    )}
                                                </div>
                                                {user.employee_id && <span className="block text-[10px] text-slate-400 font-mono font-normal">ID: {user.employee_id}</span>}
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {user.is_mfa_setup ?
                                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1"><CheckCircle size={8} /> MFA Active</span> :
                                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1"><Smartphone size={8} /> Setup Pending</span>
                                                    }
                                                </div>
                                            </div>

                                            <div className="flex gap-1">
                                                {user.role !== 'main_admin' && (
                                                    <button onClick={() => handleDelete(user.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-all" title="Delete User">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                                {user.is_mfa_setup && (
                                                    <button onClick={() => handleResetMFA(user.id)} className="text-slate-300 hover:text-amber-500 hover:bg-amber-50 p-1.5 rounded transition-all" title="Reset MFA">
                                                        <RefreshCw size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Permissions Toggles for this user */}
                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                            {user.role === 'main_admin' ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="text-xs text-purple-600 font-bold flex items-center gap-1 mb-1">
                                                        <Shield size={12} /> Full Access Granted (Main Admin)
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 opacity-75">
                                                        {PERMISSIONS_LIST.map(perm => (
                                                            <div key={perm.id} className="text-[10px] px-2 py-1 rounded-md border bg-purple-50 text-purple-700 border-purple-200 font-bold flex items-center gap-1 cursor-not-allowed">
                                                                <CheckCircle size={8} /> {perm.label}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Permissions</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {PERMISSIONS_LIST.map(perm => (
                                                            <button
                                                                key={perm.id}
                                                                onClick={() => canEdit && toggleEditPermission(user, perm.id)}
                                                                disabled={!canEdit}
                                                                className={`text-[10px] px-2 py-1 rounded-md border transition-all ${(user.permissions || []).includes(perm.id)
                                                                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                                                                    : 'bg-slate-50 text-slate-400 border-slate-200'
                                                                    } ${canEdit ? 'hover:border-slate-300 cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                                                            >
                                                                {perm.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* CREATE SECTION */}
                <div className={`flex-1 p-4 md:p-6 overflow-y-auto relative bg-white ${mobileTab === 'create' ? 'block' : 'hidden'} md:block`}>
                    <button onClick={onClose} className="hidden md:block absolute top-4 right-4 text-slate-400 hover:text-slate-800">
                        <X size={20} />
                    </button>

                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <UserPlus className="text-blue-600" /> Create New Admin
                    </h2>

                    {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2"><AlertTriangle size={16} /> {error}</div>}
                    {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm border border-emerald-100 flex items-center gap-2"><CheckCircle size={16} /> {success}</div>}

                    <form onSubmit={handleCreate} className="space-y-5">
                        {/* Only Main Admin can create Main Admins. Check local storage role. */}
                        {localStorage.getItem('role') === 'main_admin' && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Role</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                            checked={newUser.role === 'sub_admin'}
                                            onChange={() => setNewUser({ ...newUser, role: 'sub_admin' })}
                                        />
                                        <span className="ml-2 text-sm font-semibold text-slate-700">Sub Admin</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                            checked={newUser.role === 'main_admin'}
                                            onChange={() => setNewUser({ ...newUser, role: 'main_admin' })}
                                        />
                                        <span className="ml-2 text-sm font-bold text-purple-700 flex items-center gap-1">
                                            Main Admin
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee ID</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 transition-colors font-semibold uppercase"
                                    value={newUser.employee_id}
                                    onChange={e => setNewUser({ ...newUser, employee_id: e.target.value.toUpperCase() })}
                                    placeholder="EMP001"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 transition-colors font-semibold"
                                    value={newUser.username}
                                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                            <input
                                type="password"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 transition-colors font-semibold"
                                value={newUser.password}
                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                required
                            />
                        </div>

                        {/* Permissions Section - Hidden if Main Admin */}
                        {newUser.role === 'main_admin' ? (
                            <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg text-center space-y-3">
                                <div className="text-sm font-bold text-purple-800 flex items-center justify-center gap-2">
                                    <Shield size={16} /> Full Access Granted
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-left opacity-80">
                                    {PERMISSIONS_LIST.map(perm => (
                                        <div key={perm.id} className="flex items-center gap-2 text-[10px] text-purple-700 font-bold bg-white px-2 py-1 rounded border border-purple-100">
                                            <CheckCircle size={10} className="text-purple-500" /> {perm.label}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-purple-500 mt-2 italic">Main Admins inherently possess all permissions.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Assign Permissions</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {PERMISSIONS_LIST.map(perm => (
                                        <label key={perm.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedPermissions.includes(perm.id) ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                                checked={selectedPermissions.includes(perm.id)}
                                                onChange={() => togglePermission(perm.id)}
                                            />
                                            <span className={`ml-3 text-sm font-medium ${selectedPermissions.includes(perm.id) ? 'text-blue-700' : 'text-slate-600'}`}>
                                                {perm.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                                    <Lock size={12} /> Verification
                                </label>
                                <input
                                    type="password"
                                    className="w-full bg-red-50/50 border border-red-200 rounded-lg px-4 py-2.5 outline-none focus:border-red-500 transition-colors"
                                    value={newUser.admin_password}
                                    onChange={e => setNewUser({ ...newUser, admin_password: e.target.value })}
                                    placeholder="Enter YOUR Main Admin password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : 'Create User & Invite'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
