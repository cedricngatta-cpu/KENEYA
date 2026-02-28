'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Bell, ShieldAlert, CheckCircle, XCircle, MapPin,
    Users, BrainCircuit, Clock, ShieldCheck, Loader2
} from 'lucide-react';

interface ClusterRow {
    id: string;
    geo_cell: string;
    syndrome: string;
    score: number;
    status: string;
    time_window: string;
    created_at: string;
}

interface ReportRow {
    id: string;
    geo_cell: string | null;
    severity: string;
    symptoms: any;
    created_at: string;
}

export default function AdminModerationPage() {
    const supabase = createClient();
    const [activeClusters, setActiveClusters] = useState<ClusterRow[]>([]);
    const [recentReports, setRecentReports] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolvedCount, setResolvedCount] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        const [clustersRes, reportsRes, resolvedRes] = await Promise.all([
            supabase.from('clusters').select('*').eq('status', 'active').order('score', { ascending: false }),
            supabase.from('reports').select('*').eq('severity', 'rouge').order('created_at', { ascending: false }).limit(10),
            supabase.from('clusters').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
        ]);

        setActiveClusters(clustersRes.data || []);
        setRecentReports(reportsRes.data || []);
        setResolvedCount(resolvedRes.count || 0);
        setLoading(false);
    }

    async function handleResolveCluster(clusterId: string) {
        await (supabase as any).from('clusters').update({ status: 'resolved' }).eq('id', clusterId);
        fetchData();
    }

    async function handleRejectCluster(clusterId: string) {
        await (supabase as any).from('clusters').update({ status: 'rejected' }).eq('id', clusterId);
        fetchData();
    }

    const formatTime = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `Il y a ${mins} min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `Il y a ${hours}h`;
        return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-10 h-10 text-keneya-green animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-5 duration-700 pb-20">

            {/* Header with Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-keneya-red/5 rounded-full blur-3xl -z-0"></div>
                    <div className="p-6 bg-keneya-red/10 text-keneya-red rounded-[2.5rem] relative z-10 shrink-0">
                        <ShieldAlert size={48} />
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Centre de <span className="text-keneya-red">Modération</span></h1>
                        <p className="text-slate-500 font-medium italic">
                            Validation humaine des clusters détectés par l'IA. {activeClusters.length} cluster(s) actif(s) en attente de votre décision.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-center items-center text-center border border-white/5 relative overflow-hidden">
                    <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-keneya-red/20 to-transparent"></div>
                    <div className="text-5xl font-black text-white mb-2 relative z-10">{activeClusters.length}</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-keneya-red-light relative z-10 px-4 py-1 bg-keneya-red/10 rounded-full">En attente</div>
                </div>
            </div>

            {/* Alert Cards */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-6">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Clusters actifs à valider</h2>
                    <span className="flex items-center gap-1 text-[10px] font-black text-keneya-green uppercase">
                        <CheckCircle size={14} /> {resolvedCount} résolus au total
                    </span>
                </div>

                {activeClusters.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {activeClusters.map((cluster) => (
                            <div key={cluster.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden group hover:border-keneya-red/30 transition-all duration-500">
                                <div className="flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-slate-100">
                                    <div className="p-8 xl:w-2/3 space-y-6">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                                                <MapPin size={14} className="text-keneya-green" /> {cluster.geo_cell}
                                            </div>
                                            <div className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border bg-red-50 text-red-600 border-red-100">
                                                Score: {cluster.score}
                                            </div>
                                            <div className="text-xs text-slate-400 font-bold flex items-center gap-2 ml-auto">
                                                <Clock size={14} /> {formatTime(cluster.created_at)}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 mb-2">{cluster.syndrome}</h3>
                                            <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                                Cluster détecté dans la zone {cluster.geo_cell}.
                                                Fenêtre temporelle : {cluster.time_window}. Score de gravité : {cluster.score}.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-8 xl:w-1/3 bg-slate-50/50 flex flex-col justify-center gap-4">
                                        <button
                                            onClick={() => handleResolveCluster(cluster.id)}
                                            className="w-full py-5 bg-keneya-green text-white font-black text-sm uppercase tracking-[0.15em] rounded-[1.5rem] shadow-xl shadow-keneya-green/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            <ShieldCheck size={20} /> Marquer Résolu
                                        </button>
                                        <button onClick={() => handleRejectCluster(cluster.id)} className="py-4 bg-white border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                                            <XCircle size={16} /> Rejeter
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 text-center">
                        <CheckCircle size={48} className="mx-auto text-keneya-green mb-4 opacity-50" />
                        <p className="text-lg font-black text-slate-900 mb-2">Aucun cluster actif</p>
                        <p className="text-sm text-slate-400">Tout est sous contrôle pour le moment.</p>
                    </div>
                )}
            </div>

            {/* Recent Critical Reports */}
            <div className="space-y-6">
                <h2 className="text-xs font-black text-keneya-red uppercase tracking-[0.2em] px-6">Signalements Critiques Récents</h2>
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden border-l-8 border-l-keneya-red">
                    {recentReports.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 bg-slate-50/50">
                                <tr>
                                    <th className="p-6">Heure</th>
                                    <th className="p-6">Zone</th>
                                    <th className="p-6">Sévérité</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentReports.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6 text-xs font-black text-slate-400">{formatTime(r.created_at)}</td>
                                        <td className="p-6 text-sm font-bold text-keneya-navy">{r.geo_cell || 'Non localisé'}</td>
                                        <td className="p-6">
                                            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-100">
                                                {r.severity.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            <p className="text-sm font-bold">Aucun signalement critique</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
