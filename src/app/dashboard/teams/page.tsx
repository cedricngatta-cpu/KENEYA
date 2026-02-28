'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Users, Truck, Package, CheckCircle2, AlertTriangle, MapPin,
    Search, ArrowUpRight, Shield, Activity, Loader2, RefreshCw,
    Plus, X, Clock, HeartPulse
} from 'lucide-react';

interface UserRow {
    id: string;
    phone: string | null;
    role: string;
    language: string;
    created_at: string;
}

interface AidRequest {
    id: string;
    type: string;
    requester_id: string;
    status: string;
    assigned_team: string | null;
    proof_url: string | null;
    created_at: string;
}

interface ClusterRow {
    id: string;
    geo_cell: string;
    syndrome: string;
    score: number;
    status: string;
}

export default function TeamsInterventionDashboard() {
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<'teams' | 'logistics'>('teams');
    const [agents, setAgents] = useState<UserRow[]>([]);
    const [aidRequests, setAidRequests] = useState<AidRequest[]>([]);
    const [clusters, setClusters] = useState<ClusterRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modales
    const [showNewRequest, setShowNewRequest] = useState(false);
    const [newType, setNewType] = useState<'transport' | 'kits' | 'mobile_team'>('kits');
    const [creating, setCreating] = useState(false);
    const [createSuccess, setCreateSuccess] = useState(false);

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchAll() {
        setRefreshing(true);

        const [agentsR, aidR, clustersR] = await Promise.all([
            supabase.from('users').select('*').eq('role', 'community_agent').order('created_at', { ascending: false }),
            supabase.from('aid_requests').select('*').order('created_at', { ascending: false }),
            supabase.from('clusters').select('*').eq('status', 'active'),
        ]);

        setAgents(agentsR.data || []);
        setAidRequests(aidR.data || []);
        setClusters(clustersR.data || []);
        setLoading(false);
        setRefreshing(false);
    }

    async function handleCreateRequest() {
        setCreating(true);
        const { data: { user } } = await supabase.auth.getUser();

        await (supabase as any).from('aid_requests').insert({
            type: newType,
            requester_id: user?.id || '',
            status: 'pending',
        });

        setCreating(false);
        setCreateSuccess(true);
        setTimeout(() => {
            setCreateSuccess(false);
            setShowNewRequest(false);
            fetchAll();
        }, 1500);
    }

    async function handleUpdateAidStatus(id: string, newStatus: string) {
        await (supabase as any).from('aid_requests').update({ status: newStatus }).eq('id', id);
        fetchAll();
    }

    const formatTime = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'À l\'instant';
        if (mins < 60) return `${mins}min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}j`;
    };

    const filteredMembers = useMemo(() => {
        if (!searchQuery) return agents;
        return agents.filter(m =>
            (m.phone || '').includes(searchQuery) ||
            m.role.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [agents, searchQuery]);

    const pendingAid = aidRequests.filter(a => a.status === 'pending').length;
    const assignedAid = aidRequests.filter(a => a.status === 'assigned').length;
    const resolvedAid = aidRequests.filter(a => a.status === 'resolved').length;

    const typeLabel = (t: string) => t === 'transport' ? 'Transport' : t === 'kits' ? 'Kits Santé' : 'Équipe Mobile';
    const statusLabel = (s: string) => s === 'pending' ? 'En attente' : s === 'assigned' ? 'Assignée' : 'Résolue';
    const statusColor = (s: string) => s === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-200' : s === 'assigned' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-green-50 text-green-600 border-green-200';

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
                <Loader2 className="w-10 h-10 text-keneya-green animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chargement Équipes...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 relative">

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Équipes & Logistique</h1>
                    <p className="text-slate-500 font-medium">Membres du réseau terrain et demandes d'aide logistique — Abidjan</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchAll} disabled={refreshing} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                        <RefreshCw size={18} className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowNewRequest(true)}
                        className="flex items-center gap-2 bg-keneya-navy px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-keneya-navy/20 hover:bg-keneya-navy-light transition-all active:scale-95"
                    >
                        <Plus size={18} /> Demande d'Aide
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-md">
                <button
                    onClick={() => setActiveTab('teams')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'teams' ? 'bg-white text-keneya-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Users size={18} /> Agents ({agents.length})
                </button>
                <button
                    onClick={() => setActiveTab('logistics')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'logistics' ? 'bg-white text-keneya-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Package size={18} /> Logistique ({aidRequests.length})
                </button>
            </div>

            {/* TAB: ÉQUIPES */}
            {activeTab === 'teams' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {/* Barre de recherche */}
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher par téléphone ou rôle..."
                                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 font-bold text-sm text-slate-700 focus:outline-none focus:border-keneya-navy transition-all"
                            />
                        </div>

                        {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                            <div key={member.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between gap-4 hover:shadow-md transition-shadow group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${member.role === 'community_agent' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {member.role === 'community_agent' ? <Users size={24} /> : <HeartPulse size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900">{member.phone || 'Non renseigné'}</h3>
                                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${member.role === 'community_agent' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {member.role === 'community_agent' ? 'Agent Terrain' : 'Centre Santé'}
                                            </span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-xs">{member.language?.toUpperCase()}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Clock size={10} /> {formatTime(member.created_at)}
                                        </div>
                                        <div className="text-sm font-bold text-keneya-green flex items-center justify-end gap-1">
                                            <span className="w-2 h-2 rounded-full bg-keneya-green"></span> Actif
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                                <Users size={40} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-sm font-bold text-slate-400">{searchQuery ? 'Aucun membre trouvé' : 'Aucun membre dans le réseau'}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        <div className="bg-keneya-navy text-white p-6 rounded-3xl shadow-xl">
                            <h3 className="text-sm font-bold text-keneya-green-light mb-6 uppercase tracking-widest">Réseau KENEYA</h3>
                            <div className="space-y-5">
                                <div>
                                    <div className="text-4xl font-black">{agents.length}</div>
                                    <div className="text-sm font-medium text-slate-400">Agents Terrain actifs</div>
                                </div>
                                <div className="pt-4 border-t border-slate-700/50">
                                    <div className="text-3xl font-black text-red-400">{clusters.length}</div>
                                    <div className="text-sm font-medium text-slate-400">Zones en alerte</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Demandes d'aide</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600">En attente</span>
                                    <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-black rounded-lg">{pendingAid}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600">Assignées</span>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-black rounded-lg">{assignedAid}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600">Résolues</span>
                                    <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-black rounded-lg">{resolvedAid}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: LOGISTIQUE */}
            {activeTab === 'logistics' && (
                <div className="space-y-4">
                    {aidRequests.length > 0 ? aidRequests.map((req) => (
                        <div key={req.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow group">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${req.type === 'transport' ? 'bg-red-100 text-red-600' : req.type === 'kits' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                    {req.type === 'transport' ? <Truck size={24} /> : req.type === 'kits' ? <Package size={24} /> : <Activity size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">{typeLabel(req.type)}</h3>
                                    <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
                                        <Clock size={12} /> {formatTime(req.created_at)}
                                        {req.assigned_team && <span className="text-blue-500">• Équipe : {req.assigned_team}</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusColor(req.status)}`}>
                                    {statusLabel(req.status)}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {req.status === 'pending' && (
                                        <button onClick={() => handleUpdateAidStatus(req.id, 'assigned')}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg hover:bg-blue-100 border border-blue-100">
                                            Assigner
                                        </button>
                                    )}
                                    {req.status !== 'resolved' && (
                                        <button onClick={() => handleUpdateAidStatus(req.id, 'resolved')}
                                            className="px-3 py-1.5 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-lg hover:bg-green-100 border border-green-100">
                                            ✓ Résolu
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                            <Package size={40} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-sm font-bold text-slate-400">Aucune demande d'aide en cours</p>
                            <p className="text-xs text-slate-300 mt-1">Cliquez "Demande d'Aide" pour en créer une</p>
                        </div>
                    )}
                </div>
            )}

            {/* MODALE NOUVELLE DEMANDE */}
            {showNewRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewRequest(false)}>
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl space-y-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900">Nouvelle Demande d'Aide</h2>
                            <button onClick={() => setShowNewRequest(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        {createSuccess ? (
                            <div className="text-center py-8">
                                <CheckCircle2 size={48} className="mx-auto text-keneya-green mb-4" />
                                <p className="text-lg font-black text-slate-900">Demande envoyée !</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Type de besoin</label>
                                    <div className="space-y-2">
                                        {([
                                            { value: 'transport' as const, label: 'Transport médical', desc: 'Ambulance ou véhicule sanitaire' },
                                            { value: 'kits' as const, label: 'Kits Santé', desc: 'EPI, médicaments, tests rapides' },
                                            { value: 'mobile_team' as const, label: 'Équipe Mobile', desc: 'Personnel médical de renfort' },
                                        ]).map((t) => (
                                            <button key={t.value} onClick={() => setNewType(t.value)}
                                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${newType === t.value ? 'bg-keneya-navy/5 border-keneya-navy' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                                                <div className="font-black text-sm text-slate-900">{t.label}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">{t.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={handleCreateRequest} disabled={creating}
                                    className="w-full py-4 bg-keneya-navy text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:bg-keneya-navy-light active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                    {creating ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                                    {creating ? 'Envoi...' : 'Envoyer la demande'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
