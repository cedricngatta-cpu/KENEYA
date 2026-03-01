'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Activity, Users, AlertTriangle, TrendingUp, MapPin, Shield, Clock,
    ArrowRight, BrainCircuit, Search, Filter, X, CheckCircle, FileText,
    RefreshCw, Loader2, HeartPulse
} from 'lucide-react';
import Link from 'next/link';

interface ReportRow {
    id: string;
    user_id: string | null;
    symptoms: any;
    geo_cell: string | null;
    severity: string;
    created_at: string;
    patient_name?: string;
    patient_phone?: string;
    suspected_illness?: string;
}

interface ClusterRow {
    id: string;
    geo_cell: string;
    syndrome: string;
    score: number;
    status: string;
    created_at: string;
}

export default function DashboardHome() {
    const supabase = createClient();
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [clusters, setClusters] = useState<ClusterRow[]>([]);
    const [triageCount, setTriageCount] = useState(0);
    const [agentCount, setAgentCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchAll() {
        setRefreshing(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setUserName(user.email.split('@')[0]);

        const [reportsR, clustersR, triageR, agentsR] = await Promise.all([
            supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(50),
            supabase.from('clusters').select('*').eq('status', 'active').order('score', { ascending: false }),
            supabase.from('triage_results').select('id', { count: 'exact', head: true }),
            supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'community_agent'),
        ]);

        setReports(reportsR.data || []);
        setClusters(clustersR.data || []);
        setTriageCount(triageR.count || 0);
        setAgentCount(agentsR.count || 0);
        setLoading(false);
        setRefreshing(false);
    }

    // KPIs calculés
    const now = Date.now();
    const reports24h = useMemo(() => reports.filter(r => now - new Date(r.created_at).getTime() < 86400000), [reports]);
    const casRouge = reports24h.filter(r => r.severity === 'rouge').length;
    const casJaune = reports24h.filter(r => r.severity === 'jaune').length;

    // Top 3 zones
    const topZones = useMemo(() => {
        const zoneMap: Record<string, { total: number; rouge: number; jaune: number; vert: number }> = {};
        reports.forEach(r => {
            const zone = r.geo_cell || 'Inconnu';
            if (!zoneMap[zone]) zoneMap[zone] = { total: 0, rouge: 0, jaune: 0, vert: 0 };
            zoneMap[zone].total++;
            if (r.severity === 'rouge') zoneMap[zone].rouge++;
            else if (r.severity === 'jaune') zoneMap[zone].jaune++;
            else zoneMap[zone].vert++;
        });
        return Object.entries(zoneMap)
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, 3)
            .map(([zone, data]) => ({ zone, ...data }));
    }, [reports]);

    // Filtred reports
    const filteredReports = useMemo(() => {
        return reports.filter(r =>
            !searchQuery ||
            (r.geo_cell || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.patient_phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.severity.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [reports, searchQuery]);

    const formatTime = (iso: string) => {
        const diff = now - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'À l\'instant';
        if (mins < 60) return `${mins}min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}j`;
    };

    const severityLabel = (s: string) => s === 'rouge' ? 'URGENT' : s === 'jaune' ? 'MODÉRÉ' : 'FAIBLE';
    const severityColor = (s: string) => s === 'rouge' ? 'text-red-600' : s === 'jaune' ? 'text-orange-500' : 'text-green-600';
    const severityBg = (s: string) => s === 'rouge' ? 'bg-red-50 text-red-600 border-red-200' : s === 'jaune' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200';

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
                <Loader2 className="w-10 h-10 text-keneya-green animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chargement Centre de Commandement...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 relative">

            {/* MODALE DE DÉTAILS */}
            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-keneya-navy/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)}></div>
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className={`h-3 w-full ${selectedReport.severity === 'rouge' ? 'bg-red-500' : selectedReport.severity === 'jaune' ? 'bg-orange-400' : 'bg-green-500'}`}></div>
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-keneya-navy">Signalement #{selectedReport.id.substring(0, 8)}</h2>
                                    <p className="text-slate-500 font-bold">{selectedReport.geo_cell || 'Zone non définie'}</p>
                                </div>
                                <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Patient & Contact</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-black text-keneya-navy">{selectedReport.patient_name || 'Anonyme'}</span>
                                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{selectedReport.patient_phone || 'Non renseigné'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sévérité & Diagnostic</span>
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-black uppercase ${severityColor(selectedReport.severity)}`}>{selectedReport.severity}</span>
                                        <span className="text-[10px] font-bold text-slate-500">{selectedReport.suspected_illness || 'Non classé'}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-right">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date du Signalement</span>
                                    <span className="text-sm font-black text-keneya-navy">{formatTime(selectedReport.created_at)}</span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FileText size={14} /> Symptômes Déclarés
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {(Array.isArray(selectedReport.symptoms) ? selectedReport.symptoms : []).map((s: string, i: number) => (
                                        <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                                            {s}
                                        </span>
                                    ))}
                                    {(!selectedReport.symptoms || (Array.isArray(selectedReport.symptoms) && selectedReport.symptoms.length === 0)) && (
                                        <span className="text-sm text-slate-400 italic">Aucun symptôme enregistré</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 mb-4 md:mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-keneya-navy tracking-tight mb-1">Centre de Commandement</h1>
                    <p className="text-xs md:text-sm text-slate-500 font-medium flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-keneya-green animate-pulse"></span>
                        Analyse temps réel — Grand Abidjan • {userName}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <button onClick={fetchAll} disabled={refreshing} className="flex-1 lg:flex-none px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm">
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Actualiser
                    </button>
                    <Link href="/dashboard/center" className="flex-1 lg:flex-none px-4 py-2.5 bg-keneya-navy text-white font-bold rounded-xl shadow-md hover:bg-keneya-navy-light transition-colors flex items-center justify-center gap-2 text-sm">
                        <HeartPulse size={16} /> Cas Cliniques
                    </Link>
                </div>
            </div>

            {/* KPIs TEMPS RÉEL */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-[4rem] -z-10 group-hover:scale-110 transition-transform"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-2xl"><AlertTriangle size={24} /></div>
                        {casRouge > 0 && (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg animate-pulse">
                                <TrendingUp size={14} /> {casRouge} rouge
                            </span>
                        )}
                    </div>
                    <div className="text-4xl font-black text-keneya-navy tracking-tighter mb-1">{reports24h.length}</div>
                    <div className="text-sm font-bold text-slate-500">Signalements 24h</div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[4rem] -z-10 group-hover:scale-110 transition-transform"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><Activity size={24} /></div>
                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${clusters.length > 0 ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100'}`}>
                            {clusters.length > 0 ? 'Actif' : 'Calme'}
                        </span>
                    </div>
                    <div className="text-4xl font-black text-keneya-navy tracking-tighter mb-1">{clusters.length}</div>
                    <div className="text-sm font-bold text-slate-500">Clusters Actifs</div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[4rem] -z-10 group-hover:scale-110 transition-transform"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Users size={24} /></div>
                        <span className="flex items-center gap-1 text-xs font-bold text-keneya-green bg-green-50 px-2 py-1 rounded-lg">
                            <TrendingUp size={14} /> Actif
                        </span>
                    </div>
                    <div className="text-4xl font-black text-keneya-navy tracking-tighter mb-1">{agentCount}</div>
                    <div className="text-sm font-bold text-slate-500">Agents Terrain</div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-[4rem] -z-10 group-hover:scale-110 transition-transform"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl"><BrainCircuit size={24} /></div>
                    </div>
                    <div className="text-4xl font-black text-keneya-navy tracking-tighter mb-1">{triageCount.toLocaleString('fr-FR')}</div>
                    <div className="text-sm font-bold text-slate-500">Analyses IA Triage</div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* COLONNE GAUCHE */}
                <div className="xl:col-span-1 space-y-8">
                    {/* Zones Critiques */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-keneya-navy mb-6 flex items-center gap-2">
                            <MapPin className="text-red-500" size={20} /> Zones les + actives
                        </h3>
                        <div className="space-y-3">
                            {topZones.length > 0 ? topZones.map((z, i) => {
                                const colors = i === 0 ? 'bg-red-50 border-red-100 text-red-900' : i === 1 ? 'bg-orange-50 border-orange-100 text-orange-900' : 'bg-yellow-50 border-yellow-100 text-yellow-900';
                                const valueColor = i === 0 ? 'text-red-600' : i === 1 ? 'text-orange-600' : 'text-yellow-600';
                                return (
                                    <div key={z.zone} className={`flex items-center justify-between p-4 rounded-2xl border ${colors}`}>
                                        <div>
                                            <div className="font-bold">{z.zone}</div>
                                            <div className="text-xs font-medium opacity-70">R: {z.rouge} J: {z.jaune} V: {z.vert}</div>
                                        </div>
                                        <div className={`text-2xl font-black ${valueColor}`}>{z.total}</div>
                                    </div>
                                );
                            }) : (
                                <p className="text-sm text-slate-400 italic text-center py-4">Aucun signalement enregistré</p>
                            )}
                        </div>
                        <Link href="/dashboard/map" className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">
                            Voir sur la Carte SIG <ArrowRight size={16} />
                        </Link>
                    </div>

                    {/* État réseau */}
                    <div className="bg-keneya-navy p-6 rounded-[2rem] text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-keneya-green/20 rounded-full blur-[40px]"></div>
                        <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                            <Shield className="text-keneya-green" size={20} /> État du Réseau KENEYA
                        </h3>
                        <p className="text-sm text-slate-300 mb-6">
                            {clusters.length === 0 ? 'Tous les systèmes opérationnels.' : `${clusters.length} cluster(s) actif(s) détecté(s).`}
                        </p>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-400">Signalements traités</span>
                                    <span className="text-keneya-green-light">{reports.length}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-keneya-green rounded-full" style={{ width: `${Math.min(100, reports.length)}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-400">Clusters sous contrôle</span>
                                    <span className={clusters.length > 0 ? 'text-orange-400' : 'text-keneya-green-light'}>{clusters.length === 0 ? '100%' : `${clusters.length} actif(s)`}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${clusters.length === 0 ? 'bg-keneya-green w-full' : 'bg-orange-400 w-1/2'}`}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLONNE DROITE - FILE ACTIVE */}
                <div className="xl:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                        <h3 className="text-lg font-black text-keneya-navy flex items-center gap-2">
                            <Activity size={20} className="text-red-500" /> File Active ({reports.length} signalements)
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher zone, sévérité..."
                                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-slate-700 focus:outline-none focus:border-keneya-navy transition-all min-w-[200px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="text-[10px] md:text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100 bg-white">
                                    <th className="p-4 font-black">Identité & Zone</th>
                                    <th className="p-4 font-black hidden md:table-cell">Téléphone</th>
                                    <th className="p-4 font-black">Sévérité</th>
                                    <th className="p-4 font-black hidden sm:table-cell">Symptômes</th>
                                    <th className="p-4 font-black"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredReports.length > 0 ? filteredReports.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedReport(r)}>
                                        <td className="p-4 text-sm font-bold text-slate-400">{formatTime(r.created_at)}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-keneya-navy leading-none mb-1">{r.patient_name || 'Anonyme'}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={10} className="text-slate-300" />
                                                    <span className="text-[11px] font-bold text-slate-400">{r.geo_cell || 'Non localisé'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{r.patient_phone || '—'}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`text-[10px] md:text-xs font-black ${severityColor(r.severity)} uppercase`}>
                                                {severityLabel(r.severity)}
                                            </span>
                                        </td>
                                        <td className="p-4 hidden sm:table-cell">
                                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border ${severityBg(r.severity)}`}>
                                                {Array.isArray(r.symptoms) ? r.symptoms.slice(0, 2).join(', ') : '—'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-keneya-navy group-hover:text-white transition-all">
                                                <ArrowRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-400 font-bold italic">
                                            {searchQuery ? 'Aucun signalement ne correspond à votre recherche.' : 'Aucun signalement enregistré. La file est vide.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {filteredReports.length} signalement(s) affichés
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold">
                            Rafraîchissement auto: 30s
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
