'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Globe, MapPin, Activity, Filter, Loader2, AlertTriangle,
    Clock, TrendingUp, ChevronRight, RefreshCw, BarChart3,
    Crosshair, Users, HeartPulse, ShieldAlert
} from 'lucide-react';

interface DistrictData {
    geo_cell: string;
    total: number;
    rouge: number;
    jaune: number;
    vert: number;
    lastReport: string;
}

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

// Communes d'Abidjan avec coordonnées de grille pour la visualisation
const ABIDJAN_ZONES = [
    { name: 'Abobo', row: 0, col: 1 },
    { name: 'Adjamé', row: 1, col: 0 },
    { name: 'Attécoubé', row: 1, col: 1 },
    { name: 'Cocody', row: 0, col: 2 },
    { name: 'Koumassi', row: 2, col: 2 },
    { name: 'Marcory', row: 2, col: 1 },
    { name: 'Plateau', row: 1, col: 2 },
    { name: 'Port-Bouët', row: 3, col: 2 },
    { name: 'Treichville', row: 2, col: 0 },
    { name: 'Yopougon', row: 0, col: 0 },
    { name: 'Songon', row: 1, col: 3 },
    { name: 'Bingerville', row: 0, col: 3 },
    { name: 'Anyama', row: 3, col: 0 },
    { name: 'Grand-Bassam', row: 3, col: 3 },
    { name: 'ESATIC', row: 3, col: 1 },
];

type TimeFilter = '24h' | '7j' | '30j' | 'tout';

export default function AdminSIGPage() {
    const supabase = createClient();
    const [allReports, setAllReports] = useState<ReportRow[]>([]);
    const [activeClusters, setActiveClusters] = useState<ClusterRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('tout');
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [totalCenters, setTotalCenters] = useState(0);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchData() {
        setRefreshing(true);
        const [reportsRes, clustersRes, centersRes] = await Promise.all([
            supabase.from('reports').select('id, geo_cell, severity, symptoms, created_at').order('created_at', { ascending: false }),
            supabase.from('clusters').select('*').eq('status', 'active').order('score', { ascending: false }),
            supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'health_center'),
        ]);

        setAllReports(reportsRes.data || []);
        setActiveClusters(clustersRes.data || []);
        setTotalCenters(centersRes.count || 0);
        setLoading(false);
        setRefreshing(false);
    }

    // Filtrer les rapports par période
    const filteredReports = useMemo(() => {
        if (timeFilter === 'tout') return allReports;
        const now = Date.now();
        const ms = timeFilter === '24h' ? 86400000 : timeFilter === '7j' ? 604800000 : 2592000000;
        return allReports.filter(r => now - new Date(r.created_at).getTime() < ms);
    }, [allReports, timeFilter]);

    // Grouper par zone
    const districts = useMemo(() => {
        const map = new Map<string, DistrictData>();
        filteredReports.forEach((r) => {
            const zone = r.geo_cell || 'Non localisé';
            if (!map.has(zone)) {
                map.set(zone, { geo_cell: zone, total: 0, rouge: 0, jaune: 0, vert: 0, lastReport: r.created_at });
            }
            const d = map.get(zone)!;
            d.total++;
            if (r.severity === 'rouge') d.rouge++;
            else if (r.severity === 'jaune') d.jaune++;
            else d.vert++;
            if (r.created_at > d.lastReport) d.lastReport = r.created_at;
        });
        return Array.from(map.values()).sort((a, b) => b.total - a.total);
    }, [filteredReports]);

    // Rapports de la zone sélectionnée
    const zoneReports = useMemo(() => {
        if (!selectedZone) return [];
        return filteredReports.filter(r => (r.geo_cell || 'Non localisé') === selectedZone);
    }, [filteredReports, selectedZone]);

    const selectedDistrict = districts.find(d => d.geo_cell === selectedZone);

    // Statistiques globales
    const totalRouge = filteredReports.filter(r => r.severity === 'rouge').length;
    const totalJaune = filteredReports.filter(r => r.severity === 'jaune').length;
    const totalVert = filteredReports.filter(r => r.severity === 'vert').length;

    const getHeatLevel = (zoneName: string) => {
        const d = districts.find(d => d.geo_cell === zoneName);
        if (!d) return 0;
        return d.rouge * 3 + d.jaune * 2 + d.vert;
    };

    const getHeatColor = (heat: number) => {
        if (heat === 0) return 'bg-slate-800 border-slate-700';
        if (heat <= 3) return 'bg-green-900/50 border-green-700/50';
        if (heat <= 8) return 'bg-yellow-900/50 border-yellow-600/50';
        if (heat <= 15) return 'bg-orange-900/50 border-orange-500/50';
        return 'bg-red-900/60 border-red-500/60';
    };

    const getHeatGlow = (heat: number) => {
        if (heat === 0) return '';
        if (heat <= 3) return 'shadow-green-500/10';
        if (heat <= 8) return 'shadow-yellow-500/20';
        if (heat <= 15) return 'shadow-orange-500/30';
        return 'shadow-red-500/40 animate-pulse';
    };

    const formatTimeAgo = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}j`;
    };

    const getStatusLabel = (d: DistrictData) => {
        if (d.rouge > 5) return { label: 'CRITIQUE', color: 'text-red-400', bg: 'bg-red-500/20' };
        if (d.rouge > 2 || d.jaune > 5) return { label: 'VIGILANCE', color: 'text-orange-400', bg: 'bg-orange-500/20' };
        if (d.total > 0) return { label: 'NORMAL', color: 'text-green-400', bg: 'bg-green-500/20' };
        return { label: 'CALME', color: 'text-slate-500', bg: 'bg-slate-500/20' };
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-keneya-green animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chargement SIG...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-700 pb-20">

            {/* Header */}
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-keneya-green/10 rounded-full blur-[100px] -z-0"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-keneya-green rounded-2xl shadow-lg shadow-keneya-green/20">
                            <Globe size={24} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Supervision <span className="text-keneya-green-light">SIG</span></h1>
                    </div>
                    <p className="text-slate-400 font-medium max-w-xl">
                        {filteredReports.length} signalements sur {districts.length} zones — {activeClusters.length} cluster(s) actif(s) — {totalCenters} centre(s) de santé.
                    </p>
                </div>
                <div className="flex gap-3 relative z-10">
                    {(['24h', '7j', '30j', 'tout'] as TimeFilter[]).map((t) => (
                        <button key={t} onClick={() => setTimeFilter(t)}
                            className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === t ? 'bg-keneya-green text-white shadow-lg shadow-keneya-green/20' : 'bg-white/10 hover:bg-white/20 border border-white/10 text-white'}`}>
                            {t === 'tout' ? 'Tout' : t}
                        </button>
                    ))}
                    <button onClick={fetchData} disabled={refreshing}
                        className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all">
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: BarChart3, label: 'Signalements', value: filteredReports.length, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { icon: AlertTriangle, label: 'Critiques (Rouge)', value: totalRouge, color: 'text-red-500', bg: 'bg-red-50' },
                    { icon: ShieldAlert, label: 'Clusters Actifs', value: activeClusters.length, color: 'text-orange-500', bg: 'bg-orange-50' },
                    { icon: HeartPulse, label: 'Centres de Santé', value: totalCenters, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                ].map((k, i) => (
                    <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${k.bg} ${k.color}`}><k.icon size={20} /></div>
                        <div>
                            <div className="text-xl font-black text-slate-900">{k.value}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* CARTE HEATMAP INTERACTIVE */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Carte Thermique — Grand Abidjan</h3>
                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-700/60"></span> Calme</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-600/60"></span> Modéré</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500/60"></span> Élevé</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/60"></span> Critique</span>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[3rem] p-8 border border-white/5 shadow-2xl">
                        <div className="grid grid-cols-4 gap-3">
                            {ABIDJAN_ZONES.map((zone) => {
                                const heat = getHeatLevel(zone.name);
                                const districtInfo = districts.find(d => d.geo_cell === zone.name);
                                const isSelected = selectedZone === zone.name;
                                const hasCluster = activeClusters.some(c => c.geo_cell === zone.name);

                                return (
                                    <button
                                        key={zone.name}
                                        onClick={() => setSelectedZone(isSelected ? null : zone.name)}
                                        className={`relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group text-left
                                            ${getHeatColor(heat)} ${getHeatGlow(heat)} shadow-lg
                                            ${isSelected ? 'ring-2 ring-keneya-green ring-offset-2 ring-offset-slate-900 scale-105' : 'hover:scale-[1.03]'}
                                        `}
                                    >
                                        {hasCluster && (
                                            <div className="absolute top-2 right-2">
                                                <span className="flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                </span>
                                            </div>
                                        )}
                                        <div className="font-black text-white text-sm mb-1 group-hover:text-keneya-green-light transition-colors">{zone.name}</div>
                                        {districtInfo ? (
                                            <>
                                                <div className="text-2xl font-black text-white font-mono">{districtInfo.total}</div>
                                                <div className="flex gap-1 mt-2">
                                                    {districtInfo.rouge > 0 && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                                    {districtInfo.jaune > 0 && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
                                                    {districtInfo.vert > 0 && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-lg font-black text-slate-600 font-mono">0</div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Clusters sur la carte */}
                        {activeClusters.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Crosshair size={12} /> Clusters Épidémiques Actifs
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {activeClusters.map((c) => (
                                        <button key={c.id}
                                            onClick={() => setSelectedZone(c.geo_cell)}
                                            className="px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-black text-red-300 hover:bg-red-500/30 transition-all flex items-center gap-2">
                                            <AlertTriangle size={12} /> {c.geo_cell}: {c.syndrome} (Score {c.score})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Détails zone sélectionnée */}
                    {selectedZone && selectedDistrict && (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-keneya-green/30 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-keneya-green/10 text-keneya-green rounded-2xl">
                                        <Crosshair size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">{selectedZone}</h3>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${getStatusLabel(selectedDistrict).color}`}>
                                            {getStatusLabel(selectedDistrict).label}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedZone(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕ Fermer</button>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                    <div className="text-2xl font-black text-slate-900">{selectedDistrict.total}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase">Total</div>
                                </div>
                                <div className="p-4 bg-red-50 rounded-2xl text-center">
                                    <div className="text-2xl font-black text-red-600">{selectedDistrict.rouge}</div>
                                    <div className="text-[9px] font-bold text-red-400 uppercase">Rouge</div>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-2xl text-center">
                                    <div className="text-2xl font-black text-orange-600">{selectedDistrict.jaune}</div>
                                    <div className="text-[9px] font-bold text-orange-400 uppercase">Jaune</div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-2xl text-center">
                                    <div className="text-2xl font-black text-green-600">{selectedDistrict.vert}</div>
                                    <div className="text-[9px] font-bold text-green-400 uppercase">Vert</div>
                                </div>
                            </div>

                            {/* Derniers signalements de la zone */}
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Derniers Signalements</h4>
                            <div className="space-y-2 max-h-48 overflow-auto">
                                {zoneReports.length > 0 ? zoneReports.slice(0, 8).map((r) => (
                                    <div key={r.id} className={`p-3 rounded-xl border-l-4 bg-slate-50 flex items-center justify-between text-sm ${r.severity === 'rouge' ? 'border-red-500' : r.severity === 'jaune' ? 'border-orange-400' : 'border-green-500'}`}>
                                        <span className="font-bold text-slate-700">{r.severity.toUpperCase()}</span>
                                        <span className="text-xs text-slate-400 font-mono">{formatTimeAgo(r.created_at)}</span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-slate-400 italic">Aucun signalement dans cette zone</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* LISTE DISTRICTS */}
                <div className="xl:col-span-1 space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">
                        Classement des Zones ({districts.length})
                    </h3>
                    <div className="space-y-3 max-h-[70vh] overflow-auto no-scrollbar">
                        {districts.length > 0 ? districts.map((district, i) => {
                            const status = getStatusLabel(district);
                            const isSelected = selectedZone === district.geo_cell;
                            return (
                                <button
                                    key={district.geo_cell}
                                    onClick={() => setSelectedZone(isSelected ? null : district.geo_cell)}
                                    className={`w-full text-left bg-white p-5 rounded-[2rem] border shadow-sm group hover:border-keneya-green transition-all cursor-pointer ${isSelected ? 'border-keneya-green ring-1 ring-keneya-green/20' : 'border-slate-200'}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-slate-400">#{i + 1}</span>
                                            <div>
                                                <div className="font-black text-slate-900">{district.geo_cell}</div>
                                                <div className={`text-[9px] font-black uppercase tracking-widest ${status.color}`}>
                                                    {status.label}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className={`text-slate-300 transition-transform ${isSelected ? 'rotate-90 text-keneya-green' : ''}`} />
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div className="text-2xl font-black text-slate-900 font-mono">{district.total}</div>
                                        <div className="flex gap-1.5">
                                            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded">{district.rouge}</span>
                                            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-black rounded">{district.jaune}</span>
                                            <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded">{district.vert}</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                        {district.total > 0 && (
                                            <>
                                                <div className="h-full bg-red-500 transition-all" style={{ width: `${(district.rouge / district.total) * 100}%` }}></div>
                                                <div className="h-full bg-orange-400 transition-all" style={{ width: `${(district.jaune / district.total) * 100}%` }}></div>
                                                <div className="h-full bg-green-500 transition-all" style={{ width: `${(district.vert / district.total) * 100}%` }}></div>
                                            </>
                                        )}
                                    </div>
                                </button>
                            );
                        }) : (
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 text-center text-slate-400">
                                <MapPin size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm font-bold">Aucune donnée géospatiale</p>
                                <p className="text-xs mt-1">Les zones apparaîtront avec les signalements</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
