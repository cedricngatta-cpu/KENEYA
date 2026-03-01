'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
    Bell, ShieldAlert, CheckCircle, XCircle, MapPin,
    Users, BrainCircuit, Clock, ShieldCheck, Loader2, X
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
    const [scanning, setScanning] = useState(false);
    const [resolvedCount, setResolvedCount] = useState(0);
    const [selectedCluster, setSelectedCluster] = useState<ClusterRow | null>(null);
    const [clusterReports, setClusterReports] = useState<any[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [scanResult, setScanResult] = useState<{ new: number, analyzed: number } | null>(null);

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

    async function handleScanIA() {
        setScanning(true);
        try {
            const res = await fetch('/api/admin/clusters/detect', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setScanResult({ new: data.clustersCreated, analyzed: data.analyzedCount });
                await fetchData();
                setTimeout(() => setScanResult(null), 5000);
            }
        } catch (err) {
            console.error('Scan Error:', err);
        } finally {
            setScanning(false);
        }
    }

    async function fetchClusterDetails(cluster: ClusterRow) {
        setSelectedCluster(cluster);
        setLoadingReports(true);
        try {
            const res = await fetch(`/api/admin/clusters/reports?zone=${encodeURIComponent(cluster.geo_cell)}&syndrome=${encodeURIComponent(cluster.syndrome)}`);
            const data = await res.json();
            if (data.success) {
                setClusterReports(data.reports);
            }
        } catch (err) {
            console.error('Error fetching details:', err);
        } finally {
            setLoadingReports(false);
        }
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
                        {scanResult && (
                            <div className="mt-4 p-4 bg-keneya-green/10 text-keneya-green rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <CheckCircle size={20} />
                                <span className="text-sm font-black uppercase tracking-tight">Scan terminé : {scanResult.new} nouveaux clusters sur {scanResult.analyzed} rapports.</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-center items-center text-center border border-white/5 relative overflow-hidden group">
                    <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-keneya-red/20 to-transparent"></div>
                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="text-5xl font-black text-white">{activeClusters.length}</div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-keneya-red-light px-4 py-1 bg-keneya-red/10 rounded-full">En attente</div>
                    </div>

                    <button
                        onClick={handleScanIA}
                        disabled={scanning}
                        className="mt-6 w-full py-4 bg-keneya-red hover:bg-keneya-red/90 disabled:bg-slate-700 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-keneya-red/20"
                    >
                        {scanning ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                        {scanning ? 'Analyse...' : 'Lancer Scan IA'}
                    </button>
                    <p className="mt-4 text-[8px] text-slate-500 font-bold uppercase tracking-widest">Dernière analyse : Aujourd'hui</p>
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
                                    <div className="p-8 xl:w-1/3 bg-slate-50/50 flex flex-col justify-center gap-3">
                                        <button
                                            onClick={() => fetchClusterDetails(cluster)}
                                            className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 mb-2"
                                        >
                                            <BrainCircuit size={18} className="text-purple-500" /> Voir Détails
                                        </button>
                                        <button
                                            onClick={() => handleResolveCluster(cluster.id)}
                                            className="w-full py-5 bg-keneya-green text-white font-black text-sm uppercase tracking-[0.15em] rounded-[1.5rem] shadow-xl shadow-keneya-green/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            <ShieldCheck size={20} /> Valider l'Alerte
                                        </button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => handleRejectCluster(cluster.id)} className="py-3 bg-white border border-slate-200 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5">
                                                <XCircle size={14} /> Rejeter
                                            </button>
                                            <Link
                                                href={`/dashboard/alerts?zone=${encodeURIComponent(cluster.geo_cell)}&syndrome=${encodeURIComponent(cluster.syndrome)}`}
                                                className="py-3 bg-keneya-red/10 border border-keneya-red/20 text-keneya-red font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-keneya-red/20 transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <Bell size={14} /> Alerter
                                            </Link>
                                        </div>
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
            {/* MODAL D'ANALYSE DÉTAILLÉE */}
            {selectedCluster && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedCluster(null)}></div>
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    <BrainCircuit className="text-purple-600" /> Analyse de Cluster
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-3 py-1 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">{selectedCluster.geo_cell}</span>
                                    <span className="px-3 py-1 bg-keneya-red/10 text-keneya-red rounded-xl text-[10px] font-black uppercase tracking-widest">{selectedCluster.syndrome}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCluster(null)} className="p-3 hover:bg-slate-200 rounded-2xl transition-colors text-slate-400">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signalements Sources ({clusterReports.length})</h4>
                                    <div className="text-[10px] font-bold text-slate-400 italic">Fenêtre : Dernières 72 heures</div>
                                </div>

                                {loadingReports ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                                        <Loader2 className="w-10 h-10 text-keneya-green animate-spin" />
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Extraction des rapports...</p>
                                    </div>
                                ) : clusterReports.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {clusterReports.map((report) => (
                                            <div key={report.id} className="p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] hover:border-keneya-green/30 transition-all group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900">{report.patient_name || 'Anonyme'}</span>
                                                        <span className="text-[10px] font-bold text-blue-600 tracking-tighter">{report.patient_phone || 'Pas de numéro'}</span>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${report.severity === 'rouge' ? 'bg-red-100 text-red-600' : report.severity === 'jaune' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                                        {report.severity}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-medium mb-3 line-clamp-2 italic leading-relaxed">
                                                    "{report.suspected_illness || report.symptoms?.join(', ') || 'Signalement vocal'}"
                                                </div>
                                                <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatTime(report.created_at)}</span>
                                                    <div className="p-1.5 bg-white rounded-lg text-slate-300 border border-slate-100 group-hover:text-keneya-green transition-colors">
                                                        <CheckCircle size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                        <XCircle className="mx-auto text-slate-300 mb-2" size={32} />
                                        <p className="text-slate-400 text-sm font-bold tracking-tight">Aucun rapport spécifique trouvé</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center sm:text-left">
                                Ces données sont strictement confidentielles <br /> Réservé à l'usage de la Mairie d'Abidjan
                            </p>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button onClick={() => setSelectedCluster(null)} className="flex-1 sm:flex-none px-8 py-4 bg-white border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-colors">
                                    Fermer
                                </button>
                                <Link
                                    href={`/dashboard/alerts?zone=${encodeURIComponent(selectedCluster.geo_cell)}&syndrome=${encodeURIComponent(selectedCluster.syndrome)}`}
                                    className="flex-1 sm:flex-none px-8 py-4 bg-keneya-red text-white font-black text-xs uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-keneya-red/20 hover:scale-[1.05] transition-all flex items-center justify-center gap-2"
                                >
                                    <Bell size={16} /> Lancer l'Alerte
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
