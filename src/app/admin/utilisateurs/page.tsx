'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Users, UserPlus, Phone, CheckCircle,
    XCircle, Clock, Shield, Search as SearchIcon, Loader2,
    Edit2, Trash2, X, RefreshCw, ChevronDown
} from 'lucide-react';

interface UserRow {
    id: string;
    role: string;
    phone: string | null;
    language: string;
    org_id: string | null;
    created_at: string;
}

const ROLES = [
    { value: 'admin', label: 'Super Admin', color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { value: 'community_agent', label: 'Agent Terrain', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { value: 'health_center', label: 'Centre de Santé', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { value: 'district', label: 'District Sanitaire', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { value: 'city_hall', label: 'Mairie', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { value: 'citizen', label: 'Citoyen', color: 'bg-slate-50 text-slate-500 border-slate-100' },
];

const ROLE_LABELS: Record<string, string> = Object.fromEntries(ROLES.map(r => [r.value, r.label]));
const ROLE_COLORS: Record<string, string> = Object.fromEntries(ROLES.map(r => [r.value, r.color]));

export default function AdminUsersPage() {
    const supabase = createClient();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('Tous');

    // Modales
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);

    // Formulaire création
    const [newPhone, setNewPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('community_agent');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ phone: string, password: string, url: string } | null>(null);

    // Édition
    const [editRole, setEditRole] = useState('');
    const [editLanguage, setEditLanguage] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    // Suppression
    const [deleting, setDeleting] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await (supabase
            .from('users') as any)
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) setUsers(data);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // === CRÉER UN UTILISATEUR ===
    async function handleCreateUser() {
        if (!newPhone || !newPassword) {
            setCreateError('Téléphone et mot de passe requis');
            return;
        }
        setCreating(true);
        setCreateError('');

        const email = `${newPhone.replace(/\s+/g, '')}@keneya.ci`;

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: newPhone,
                    password: newPassword,
                    role: newRole,
                    language: 'fr'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setCreateError(data.error || 'Erreur lors de la création');
                setCreating(false);
                return;
            }

            const getDashboardUrl = (role: string) => {
                const base = typeof window !== 'undefined' ? window.location.origin : 'https://keneya.ci';
                switch (role) {
                    case 'admin': return `${base}/admin`;
                    case 'health_center': return `${base}/dashboard/center`;
                    case 'community_agent': return `${base}/dashboard/agent`;
                    case 'district': return `${base}/dashboard/district`;
                    case 'city_hall': return `${base}/dashboard/city_hall`;
                    default: return `${base}/pro/login`;
                }
            };

            setCreatedCredentials({
                phone: newPhone,
                password: newPassword,
                url: getDashboardUrl(newRole)
            });

            setCreating(false);
            setCreateSuccess(true);
            setNewPhone('');
            setNewPassword('');
            setNewRole('community_agent');
            fetchUsers();

        } catch (err: unknown) {
            if (err instanceof Error) {
                setCreateError(err.message || 'Erreur de connexion serveur');
            } else {
                setCreateError('Erreur de connexion serveur');
            }
            setCreating(false);
        }
    }

    // === MODIFIER UN UTILISATEUR ===
    function startEdit(user: UserRow) {
        setEditingUser(user);
        setEditRole(user.role);
        setEditLanguage(user.language || 'fr');
    }

    async function handleSaveEdit() {
        if (!editingUser) return;
        setSavingEdit(true);

        await (supabase.from('users') as any).update({
            role: editRole,
            language: editLanguage,
        }).eq('id', editingUser.id);

        setSavingEdit(false);
        setEditingUser(null);
        fetchUsers();
    }

    // === SUPPRIMER UN UTILISATEUR ===
    async function handleDeleteUser() {
        if (!deletingUser) return;
        setDeleting(true);

        await (supabase.from('users') as any).delete().eq('id', deletingUser.id);

        setDeleting(false);
        setDeletingUser(null);
        fetchUsers();
    }

    const filteredUsers = users.filter((u) => {
        const matchSearch = !searchTerm ||
            u.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ROLE_LABELS[u.role] || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = selectedRole === 'Tous' ||
            (selectedRole === 'Admins' && u.role === 'admin') ||
            (selectedRole === 'Agents' && u.role === 'community_agent') ||
            (selectedRole === 'Centres' && u.role === 'health_center') ||
            (selectedRole === 'Citoyens' && u.role === 'citizen');
        return matchSearch && matchRole;
    });

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Compteurs par rôle
    const countByRole = (role: string) => users.filter(u => u.role === role).length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-700 pb-20">

            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">Gestion des <span className="text-keneya-green">Utilisateurs</span></h1>
                    <p className="text-sm md:text-base text-slate-500 font-medium max-w-xl">
                        {users.length} utilisateur(s) sur la plateforme KENEYA.
                    </p>
                </div>
                <div className="flex gap-2 w-full lg:w-auto">
                    <button onClick={fetchUsers} className="p-3 md:p-4 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
                        <RefreshCw size={20} />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex-1 lg:flex-none px-4 md:px-6 py-4 bg-keneya-navy text-white font-black text-xs md:text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-keneya-navy-light transition-all shadow-xl shadow-keneya-navy/20 active:scale-95"
                    >
                        <UserPlus size={20} /> Nouveau
                    </button>
                </div>
            </div>

            {/* Compteurs par rôle */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {ROLES.map((r) => (
                    <button
                        key={r.value}
                        onClick={() => setSelectedRole(r.value === 'admin' ? 'Admins' : r.value === 'community_agent' ? 'Agents' : r.value === 'health_center' ? 'Centres' : r.value === 'citizen' ? 'Citoyens' : 'Tous')}
                        className={`p-4 rounded-2xl border transition-all text-left hover:scale-[1.02] ${r.color}`}
                    >
                        <div className="text-xl font-black">{countByRole(r.value)}</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-70">{r.label}</div>
                    </button>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-4 rounded-[1.8rem] border border-slate-200 shadow-sm">
                <div className="relative flex-1 group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-keneya-green transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher par téléphone, rôle..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-keneya-green focus:bg-white transition-all font-medium"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['Tous', 'Admins', 'Agents', 'Centres', 'Citoyens'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRole === role ? 'bg-keneya-navy text-white shadow-lg shadow-keneya-navy/20' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-keneya-green animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                <tr>
                                    <th className="p-4 md:p-6">Utilisateur</th>
                                    <th className="p-4 md:p-6">Rôle</th>
                                    <th className="p-4 md:p-6 hidden md:table-cell">Téléphone</th>
                                    <th className="p-4 md:p-6 hidden sm:table-cell">Langue</th>
                                    <th className="p-4 md:p-6 hidden lg:table-cell">Inscrit le</th>
                                    <th className="p-4 md:p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-500 group-hover:bg-keneya-green/10 group-hover:text-keneya-green transition-colors text-sm">
                                                    {(user.phone || 'U').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{user.phone || 'Non renseigné'}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{user.id.substring(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider border ${ROLE_COLORS[user.role] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 md:p-6 hidden md:table-cell">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                <Phone size={14} className="text-slate-300" />
                                                {user.phone || '—'}
                                            </div>
                                        </td>
                                        <td className="p-4 md:p-6 hidden sm:table-cell">
                                            <span className="text-xs font-bold text-slate-500 uppercase">{user.language || 'fr'}</span>
                                        </td>
                                        <td className="p-4 md:p-6 hidden lg:table-cell">
                                            <span className="text-xs text-slate-400 font-medium">{formatDate(user.created_at)}</span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEdit(user)}
                                                    className="p-2 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md rounded-xl transition-all text-slate-400"
                                                    title="Modifier le rôle"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingUser(user)}
                                                    className="p-2 hover:bg-red-50 hover:text-red-600 hover:shadow-md rounded-xl transition-all text-slate-400"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center">
                                            <Users size={32} className="mx-auto text-slate-300 mb-3" />
                                            <p className="text-sm font-bold text-slate-400">Aucun utilisateur trouvé</p>
                                            <p className="text-xs text-slate-300 mt-1">Essayez un autre filtre ou terme de recherche</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-400">
                        {filteredUsers.length} sur {users.length} utilisateurs
                    </div>
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        Rafraîchi à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* === MODALE CRÉATION === */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl space-y-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <UserPlus size={24} className="text-keneya-green" /> Nouvel Utilisateur
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        {createSuccess && createdCredentials ? (
                            <div className="text-center py-4 space-y-6">
                                <div>
                                    <CheckCircle size={48} className="mx-auto text-keneya-green mb-4" />
                                    <p className="text-lg font-black text-slate-900">Utilisateur créé avec succès !</p>
                                    <p className="text-sm text-slate-500 font-medium">Copiez ces accès et transmettez-les à l'agent.</p>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lien de connexion</div>
                                        <div className="text-sm font-bold text-keneya-navy break-all">{createdCredentials.url}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Numéro de téléphone (ID)</div>
                                        <div className="text-lg font-black text-slate-900">{createdCredentials.phone}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mot de passe temporaire</div>
                                        <div className="text-lg font-black tracking-widest text-slate-900">{createdCredentials.password}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setCreateSuccess(false);
                                        setCreatedCredentials(null);
                                        setShowCreateModal(false);
                                    }}
                                    className="w-full py-4 bg-slate-100 text-slate-600 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    Fermer
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Numéro de téléphone</label>
                                        <input
                                            type="text"
                                            value={newPhone}
                                            onChange={(e) => setNewPhone(e.target.value)}
                                            placeholder="0X XX XX XX XX"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-keneya-green focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Mot de passe</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Minimum 6 caractères"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-keneya-green focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Rôle</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {ROLES.filter(r => r.value !== 'citizen').map((r) => (
                                                <button
                                                    key={r.value}
                                                    onClick={() => setNewRole(r.value)}
                                                    className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${newRole === r.value ? 'bg-keneya-navy text-white border-keneya-navy shadow-lg' : `${r.color}`}`}
                                                >
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {createError && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
                                        {createError}
                                    </div>
                                )}

                                <button
                                    onClick={handleCreateUser}
                                    disabled={creating}
                                    className="w-full py-4 bg-keneya-green text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-keneya-green/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {creating ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                                    {creating ? 'Création...' : 'Créer l\'utilisateur'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* === MODALE ÉDITION === */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl space-y-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <Edit2 size={24} className="text-blue-600" /> Modifier l'utilisateur
                            </h2>
                            <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-sm font-bold text-slate-900">{editingUser.phone || 'Non renseigné'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{editingUser.id}</div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Rôle</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ROLES.map((r) => (
                                        <button
                                            key={r.value}
                                            onClick={() => setEditRole(r.value)}
                                            className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${editRole === r.value ? 'bg-keneya-navy text-white border-keneya-navy shadow-lg' : `${r.color}`}`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Langue</label>
                                <div className="flex gap-2">
                                    {['fr', 'dioula', 'baoulé'].map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => setEditLanguage(lang)}
                                            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${editLanguage === lang ? 'bg-keneya-green text-white border-keneya-green' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveEdit}
                            disabled={savingEdit}
                            className="w-full py-4 bg-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {savingEdit ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                            {savingEdit ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                        </button>
                    </div>
                </div>
            )}

            {/* === MODALE SUPPRESSION === */}
            {deletingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeletingUser(null)}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl space-y-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-2">Supprimer cet utilisateur ?</h2>
                            <p className="text-sm text-slate-500">
                                <span className="font-bold text-slate-700">{deletingUser.phone || deletingUser.id.substring(0, 8)}</span> ({ROLE_LABELS[deletingUser.role] || deletingUser.role})
                            </p>
                            <p className="text-xs text-red-400 font-bold mt-2">Cette action est irréversible.</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingUser(null)}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={deleting}
                                className="flex-1 py-4 bg-red-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-red-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                {deleting ? '...' : 'Supprimer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
