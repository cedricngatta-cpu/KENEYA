'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    HeartPulse, FileText, AlertTriangle, Activity,
    Plus, Clock, Users, Loader2, CheckCircle,
    TrendingUp, Stethoscope, ClipboardList, X, RefreshCw
} from 'lucide-react';

interface ClinicalCase {
    id: string;
    syndrome: string;
    status: string;
    severity: string;
    created_at: string;
}

interface ReportRow {
    id: string;
    geo_cell: string | null;
    severity: string;
    symptoms: any;
    created_at: string;
}

export default function CenterDashboardPage() {
    const supabase = createClient();
    const [cases, setCases] = useState<ClinicalCase[]>([]);
    const [recentReports, setRecentReports] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [centerName, setCenterName] = useState('Centre de Santé');
    const [showNewCase, setShowNewCase] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Formulaire nouveau cas
    const [newSyndrome, setNewSyndrome] = useState('');
    const [newSeverity, setNewSeverity] = useState('jaune');
    const [newStatus, setNewStatus] = useState('suspect');
    const [creating, setCreating] = useState(false);
    const [createSuccess, setCreateSuccess] = useState(false);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchData() {
        setRefreshing(true);

        // Récupérer l'identité du centre
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
            setCenterName(user.email.split('@')[0]);
        }

        const [casesRes, reportsRes] = await Promise.all([
            supabase.from('clinical_cases').select('*').order('created_at', { ascending: false }).limit(20),
            supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(10),
        ]);

        setCases(casesRes.data || []);
        setRecentReports(reportsRes.data || []);
        setLoading(false);
        setRefreshing(false);
    }

    async function handleCreateCase() {
        if (!newSyndrome.trim()) return;
        setCreating(true);

        const { data: { user } } = await supabase.auth.getUser();

        await (supabase as any).from('clinical_cases').insert({
            facility_id: user?.id || '',
            syndrome: newSyndrome,
            severity: newSeverity,
            status: newStatus,
        });

        setCreating(false);
        setCreateSuccess(true);
        setNewSyndrome('');
        setNewSeverity('jaune');
        setNewStatus('suspect');
        setTimeout(() => {
            setCreateSuccess(false);
            setShowNewCase(false);
            fetchData();
        }, 1500);
    }

    async function handleUpdateStatus(id: string, newSt: string) {
        await (supabase as any).from('clinical_cases').update({ status: newSt }).eq('id', id);
        fetchData();
    }

    const formatTime = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}j`;
    };

    const suspectCount = cases.filter(c => c.status === 'suspect').length;
    const probableCount = cases.filter(c => c.status === 'probable').length;
    const confirmedCount = cases.filter(c => c.status === 'confirmed').length;
    const criticalReports = recentReports.filter(r => r.severity === 'rouge').length;

    const severityColor = (s: string) => s === 'rouge' ? 'bg-red-50 text-red-600 border-red-100' : s === 'jaune' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100';
    const statusColor = (s: string) => s === 'confirmed' ? 'bg-red-50 text-red-600' : s === 'probable' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600';

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
                <Loader2 className="w-10 h-10 text-keneya-green animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chargement Centre...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Tableau de Bord <span className="text-emerald-600">Centre</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Bienvenue, {centerName} — Gestion des cas cliniques et suivi épidémiologique
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchData} disabled={refreshing} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
                        <RefreshCw size={18} className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowNewCase(true)}
                        className="px-6 py-3 bg-emerald-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                        <Plus size={18} /> Nouveau Cas
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: Stethoscope, label: 'Cas Suspects', value: suspectCount, color: 'text-blue-500 bg-blue-50', border: 'border-blue-100' },
                    { icon: AlertTriangle, label: 'Cas Probables', value: probableCount, color: 'text-orange-500 bg-orange-50', border: 'border-orange-100' },
                    { icon: CheckCircle, label: 'Cas Confirmés', value: confirmedCount, color: 'text-red-500 bg-red-50', border: 'border-red-100' },
                    { icon: Activity, label: 'Signalements Critiques', value: criticalReports, color: 'text-purple-500 bg-purple-50', border: 'border-purple-100' },
                ].map((k, i) => (
                    <div key={i} className={`bg-white p-5 rounded-2xl border ${k.border} flex items-center gap-4`}>
                        <div className={`p-3 rounded-xl ${k.color}`}><k.icon size={20} /></div>
                        <div>
                            <div className="text-2xl font-black text-slate-900">{k.value}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Cas Cliniques */}
                <div className="xl:col-span-2 space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">
                        Cas Cliniques ({cases.length})
                    </h3>

                    {cases.length > 0 ? (
                        <div className="space-y-3">
                            {cases.map((c) => (
                                <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between group hover:border-emerald-200 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${severityColor(c.severity)}`}>
                                            <HeartPulse size={20} />
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900">{c.syndrome}</div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${severityColor(c.severity)}`}>
                                                    {c.severity}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${statusColor(c.status)}`}>
                                                    {c.status}
                                                </span>
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Clock size={10} /> {formatTime(c.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {c.status === 'suspect' && (
                                            <button onClick={() => handleUpdateStatus(c.id, 'probable')}
                                                className="px-3 py-1.5 bg-orange-50 text-orange-600 text-[10px] font-black uppercase rounded-lg hover:bg-orange-100 transition-all border border-orange-100">
                                                → Probable
                                            </button>
                                        )}
                                        {(c.status === 'suspect' || c.status === 'probable') && (
                                            <button onClick={() => handleUpdateStatus(c.id, 'confirmed')}
                                                className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-lg hover:bg-red-100 transition-all border border-red-100">
                                                → Confirmé
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                            <ClipboardList size={40} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-sm font-bold text-slate-400">Aucun cas clinique enregistré</p>
                            <p className="text-xs text-slate-300 mt-1">Cliquez "Nouveau Cas" pour commencer</p>
                        </div>
                    )}
                </div>

                {/* Signalements récents de la zone */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">
                        Signalements Récents ({recentReports.length})
                    </h3>

                    {recentReports.length > 0 ? (
                        <div className="space-y-3 max-h-[60vh] overflow-auto no-scrollbar">
                            {recentReports.map((r) => (
                                <div key={r.id} className={`bg-white p-4 rounded-2xl border-l-4 border border-slate-100 ${r.severity === 'rouge' ? 'border-l-red-500' : r.severity === 'jaune' ? 'border-l-orange-400' : 'border-l-green-500'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${severityColor(r.severity)}`}>
                                            {r.severity}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">{formatTime(r.created_at)}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium mt-1">
                                        {r.geo_cell || 'Non localisé'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                            <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-sm font-bold text-slate-400">Aucun signalement</p>
                        </div>
                    )}
                </div>
            </div>

            {/* === MODALE NOUVEAU CAS === */}
            {showNewCase && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewCase(false)}>
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl space-y-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <HeartPulse size={24} className="text-emerald-600" /> Nouveau Cas Clinique
                            </h2>
                            <button onClick={() => setShowNewCase(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        {createSuccess ? (
                            <div className="text-center py-8">
                                <CheckCircle size={48} className="mx-auto text-emerald-600 mb-4" />
                                <p className="text-lg font-black text-slate-900">Cas enregistré !</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Syndrome / Diagnostic</label>
                                        <input
                                            type="text"
                                            value={newSyndrome}
                                            onChange={(e) => setNewSyndrome(e.target.value)}
                                            placeholder="Ex: Fièvre hémorragique, Diarrhée aiguë..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Sévérité</label>
                                        <div className="flex gap-2">
                                            {[
                                                { value: 'vert', label: 'Vert', color: 'bg-green-50 text-green-600 border-green-200' },
                                                { value: 'jaune', label: 'Jaune', color: 'bg-orange-50 text-orange-600 border-orange-200' },
                                                { value: 'rouge', label: 'Rouge', color: 'bg-red-50 text-red-600 border-red-200' },
                                            ].map((s) => (
                                                <button key={s.value} onClick={() => setNewSeverity(s.value)}
                                                    className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${newSeverity === s.value ? `${s.color} shadow-md` : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Statut</label>
                                        <div className="flex gap-2">
                                            {[
                                                { value: 'suspect', label: 'Suspect' },
                                                { value: 'probable', label: 'Probable' },
                                                { value: 'confirmed', label: 'Confirmé' },
                                            ].map((s) => (
                                                <button key={s.value} onClick={() => setNewStatus(s.value)}
                                                    className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${newStatus === s.value ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button onClick={handleCreateCase} disabled={creating || !newSyndrome.trim()}
                                    className="w-full py-4 bg-emerald-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                    {creating ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                                    {creating ? 'Enregistrement...' : 'Enregistrer le cas'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
