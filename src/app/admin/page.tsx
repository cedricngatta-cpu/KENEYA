'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Activity, Users, Shield, Clock, BrainCircuit, Globe, Zap,
    Server, Database, MessageSquare, HeartPulse, TrendingDown,
    Target, BarChart3, AlertTriangle, ShieldAlert, Loader2, FileText,
    RefreshCw, TrendingUp
} from 'lucide-react';

interface DashboardStats {
    totalUsers: number;
    totalAgents: number;
    totalCenters: number;
    totalReports: number;
    reportsRouge: number;
    reportsJaune: number;
    reportsVert: number;
    totalTriages: number;
    activeClusters: number;
    totalAlerts: number;
    pendingAid: number;
}

interface RecentReport {
    id: string;
    geo_cell: string | null;
    severity: string;
    symptoms: any;
    created_at: string;
    patient_name?: string;
    patient_phone?: string;
    suspected_illness?: string;
}

interface ActiveCluster {
    id: string;
    geo_cell: string;
    syndrome: string;
    score: number;
    status: string;
}

export default function AdminPage() {
    const supabase = createClient();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
    const [activeClusters, setActiveClusters] = useState<ActiveCluster[]>([]);
    const [loading, setLoading] = useState(true);
    const [dbStatus, setDbStatus] = useState<'ok' | 'error'>('ok');

    useEffect(() => {
        fetchDashboardData();
        // Rafraîchissement automatique toutes les 30 secondes
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchDashboardData() {
        try {
            // Compteurs utilisateurs
            const [usersRes, agentsRes, centersRes] = await Promise.all([
                supabase.from('users').select('id', { count: 'exact', head: true }),
                supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'community_agent'),
                supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'health_center'),
            ]);

            // Compteurs signalements
            const [reportsRes, reportsRougeRes, reportsJauneRes, reportsVertRes] = await Promise.all([
                supabase.from('reports').select('id', { count: 'exact', head: true }),
                supabase.from('reports').select('id', { count: 'exact', head: true }).eq('severity', 'rouge'),
                supabase.from('reports').select('id', { count: 'exact', head: true }).eq('severity', 'jaune'),
                supabase.from('reports').select('id', { count: 'exact', head: true }).eq('severity', 'vert'),
            ]);

            // Compteurs triage, clusters, alertes, aide
            const [triageRes, clustersRes, alertsRes, aidRes] = await Promise.all([
                supabase.from('triage_results').select('id', { count: 'exact', head: true }),
                supabase.from('clusters').select('id', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('alerts').select('id', { count: 'exact', head: true }),
                supabase.from('aid_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            ]);

            // Derniers signalements
            const { data: recent } = await supabase
                .from('reports')
                .select('id, geo_cell, severity, symptoms, created_at, patient_name, patient_phone, suspected_illness')
                .order('created_at', { ascending: false })
                .limit(10);

            // Clusters actifs
            const { data: clusters } = await supabase
                .from('clusters')
                .select('id, geo_cell, syndrome, score, status')
                .eq('status', 'active')
                .order('score', { ascending: false })
                .limit(5);

            setStats({
                totalUsers: usersRes.count || 0,
                totalAgents: agentsRes.count || 0,
                totalCenters: centersRes.count || 0,
                totalReports: reportsRes.count || 0,
                reportsRouge: reportsRougeRes.count || 0,
                reportsJaune: reportsJauneRes.count || 0,
                reportsVert: reportsVertRes.count || 0,
                totalTriages: triageRes.count || 0,
                activeClusters: clustersRes.count || 0,
                totalAlerts: alertsRes.count || 0,
                pendingAid: aidRes.count || 0,
            });

            setRecentReports(recent || []);
            setActiveClusters(clusters || []);
            setDbStatus('ok');
        } catch (err) {
            console.error('Erreur chargement dashboard:', err);
            setDbStatus('error');
        } finally {
            setLoading(false);
        }
    }

    const severityColor = (s: string) => {
        switch (s) {
            case 'rouge': return 'bg-red-500';
            case 'jaune': return 'bg-orange-400';
            case 'vert': return 'bg-keneya-green';
            default: return 'bg-slate-300';
        }
    };

    const severityBadge = (s: string) => {
        switch (s) {
            case 'rouge': return 'bg-red-50 text-red-600';
            case 'jaune': return 'bg-orange-50 text-orange-600';
            case 'vert': return 'bg-green-50 text-green-600';
            default: return 'bg-slate-50 text-slate-600';
        }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-keneya-green animate-spin" />
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest animate-pulse">Chargement des données...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 relative">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-6 mb-4 md:mb-8">
                <div>
                    <h1 className="text-xl md:text-3xl font-black text-keneya-navy tracking-tight mb-1">Console d'Administration</h1>
                    <p className="text-slate-500 text-xs md:text-base font-medium flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-keneya-green animate-pulse"></span>
                        <span className="truncate">Vue globale — Écosystème KENEYA</span>
                    </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={fetchDashboardData} disabled={loading} className="flex-1 md:flex-none px-4 md:px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
                    </button>
                </div>
            </div>

            {/* COMPTEURS PRINCIPAUX */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { icon: Users, label: 'Agents Terrain', value: stats?.totalAgents || 0, baseColor: 'blue', isPulse: false },
                    { icon: HeartPulse, label: 'Centres de Santé', value: stats?.totalCenters || 0, baseColor: 'emerald', isPulse: false },
                    { icon: AlertTriangle, label: 'Alertes Rouges', value: stats?.reportsRouge || 0, baseColor: 'red', isPulse: true },
                    { icon: Target, label: 'Clusters Actifs', value: stats?.activeClusters || 0, baseColor: 'orange', isPulse: true },
                ].map((item, i) => {
                    const colorMap: any = {
                        blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100' },
                        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
                        red: { bg: 'bg-red-50', text: 'text-red-600', iconBg: 'bg-red-100' },
                        orange: { bg: 'bg-orange-50', text: 'text-orange-600', iconBg: 'bg-orange-100' }
                    };
                    const colors = colorMap[item.baseColor];

                    return (
                        <div key={i} className="bg-white p-5 md:p-6 rounded-3xl md:rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-16 md:w-24 h-16 md:h-24 ${colors.bg} rounded-bl-[2rem] md:rounded-bl-[4rem] -z-10 group-hover:scale-110 transition-transform`}></div>
                            <div className="flex justify-between items-start mb-3 md:mb-4">
                                <div className={`p-2.5 md:p-3 ${colors.iconBg} ${colors.text} rounded-xl md:rounded-2xl`}>
                                    <item.icon size={20} className="md:w-6 md:h-6" />
                                </div>
                                {item.isPulse && item.value > 0 && (
                                    <span className={`flex items-center gap-1 text-[10px] md:text-xs font-bold ${colors.text} ${colors.bg} px-2 py-0.5 md:py-1 rounded-lg animate-pulse`}>
                                        <TrendingUp size={12} className="md:w-3.5 md:h-3.5" /> Actif
                                    </span>
                                )}
                            </div>
                            <div className="text-2xl md:text-4xl font-black text-keneya-navy tracking-tighter mb-1">{item.value}</div>
                            <div className="text-[11px] md:text-sm font-bold text-slate-500 uppercase tracking-wide">{item.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* PERFORMANCE GRIDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-slate-900">

                {/* IA TRIAGE */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <BrainCircuit size={24} />
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-slate-400 uppercase">Total Triages</div>
                            <div className="text-base font-black text-slate-900">{stats?.totalTriages || 0}</div>
                        </div>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">Moteur IA Triage</h3>
                    <p className="text-slate-500 text-[11px] mb-5 font-medium leading-relaxed">Analyses automatiques des symptômes par le moteur IA en production.</p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                            <div className="text-base font-black text-green-600">{stats?.reportsVert || 0}</div>
                            <div className="text-[9px] font-bold text-green-500">VERT</div>
                        </div>
                        <div className="flex-1 bg-orange-50 rounded-lg p-2 text-center">
                            <div className="text-base font-black text-orange-600">{stats?.reportsJaune || 0}</div>
                            <div className="text-[9px] font-bold text-orange-500">JAUNE</div>
                        </div>
                        <div className="flex-1 bg-red-50 rounded-lg p-2 text-center">
                            <div className="text-base font-black text-red-600">{stats?.reportsRouge || 0}</div>
                            <div className="text-[9px] font-bold text-red-500">ROUGE</div>
                        </div>
                    </div>
                </div>

                {/* GESTION UTILISATEURS */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Users size={24} />
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-slate-400 uppercase">Total</div>
                            <div className="text-base font-black text-slate-900">{stats?.totalUsers || 0} Utilisateurs</div>
                        </div>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">Effectifs Terrain</h3>
                    <p className="text-slate-500 text-sm mb-6 font-medium leading-relaxed">Agents communautaires et centres de santé enregistrés sur la plateforme.</p>
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold">
                            <span>Agents Communautaires</span>
                            <span className="font-black">{stats?.totalAgents || 0}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${stats?.totalUsers ? ((stats?.totalAgents || 0) / (stats?.totalUsers || 1)) * 100 : 0}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                            <span>Centres de Santé</span>
                            <span className="font-black">{stats?.totalCenters || 0}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${stats?.totalUsers ? ((stats?.totalCenters || 0) / (stats?.totalUsers || 1)) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* CLUSTERS ACTIFS */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-keneya-red/10 text-keneya-red rounded-2xl group-hover:bg-keneya-red group-hover:text-white transition-colors">
                            <ShieldAlert size={24} />
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-slate-400 uppercase">Clusters</div>
                            <div className="text-base font-black text-slate-900">{stats?.activeClusters || 0} Actifs</div>
                        </div>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">Détection Épidémique</h3>
                    <p className="text-slate-500 text-sm mb-6 font-medium leading-relaxed">Zones à risque détectées par l'algorithme de clustering géospatial.</p>
                    <div className="flex flex-wrap gap-2">
                        {activeClusters.length > 0 ? activeClusters.map((c) => (
                            <span key={c.id} className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-lg uppercase">
                                {c.geo_cell} — {c.syndrome}
                            </span>
                        )) : (
                            <span className="px-3 py-1.5 bg-green-50 text-green-600 text-[10px] font-black rounded-lg">Aucun cluster actif</span>
                        )}
                    </div>
                </div>
            </div>

            {/* DÉTAILS & LOGS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* INFRASTRUCTURE */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                        <Server className="text-slate-400" size={20} /> Infrastructure Technique
                    </h3>
                    <div className="space-y-3">
                        {[
                            { name: 'Base de Données (Supabase)', status: dbStatus === 'ok' ? 'Opérationnel' : 'Erreur', color: dbStatus === 'ok' ? 'bg-keneya-green' : 'bg-keneya-red' },
                            { name: 'Moteur de Triage (IA)', status: 'Opérationnel', color: 'bg-keneya-green' },
                            { name: 'API Mapping (ORS)', status: 'Opérationnel', color: 'bg-keneya-green' },
                            { name: 'Passerelle WhatsApp', status: 'Opérationnel', color: 'bg-keneya-green' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-700">{item.name}</span>
                                <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                                    <span className={`w-2 h-2 rounded-full ${item.color} shadow-sm`}></span> {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DERNIERS SIGNALEMENTS */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                        <FileText className="text-slate-400" size={20} /> Derniers Signalements
                    </h3>
                    <div className="flex-1 space-y-3">
                        {recentReports.length > 0 ? recentReports.map((r) => (
                            <div key={r.id} className={`p-3 bg-slate-50 rounded-xl border-l-4 ${r.severity === 'rouge' ? 'border-red-500' : r.severity === 'jaune' ? 'border-orange-400' : 'border-keneya-green'} text-slate-600 flex items-center justify-between gap-3`}>
                                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${severityColor(r.severity)}`}></span>
                                        <span className="font-black text-xs text-slate-900 truncate">{r.patient_name || 'Citoyen Anonyme'}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 ml-3.5 mt-0.5">
                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100 w-fit shrink-0 tracking-tighter">{r.patient_phone || 'Sans No'}</span>
                                        <span className="text-[9px] font-bold text-slate-500 truncate italic">{r.suspected_illness || 'Symptômes divers'}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${severityBadge(r.severity)} uppercase`}>{r.severity}</span>
                                    <span className="text-[8px] font-mono text-slate-400">{formatTime(r.created_at)}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                <FileText size={32} className="mb-2 opacity-30" />
                                <p className="text-sm font-bold">Aucun signalement</p>
                                <p className="text-xs">Les signalements citoyens apparaîtront ici</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
