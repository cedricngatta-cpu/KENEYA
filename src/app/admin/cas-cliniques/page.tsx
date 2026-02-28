'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    HeartPulse, Search, Filter, RefreshCw, Loader2, Download,
    AlertTriangle, CheckCircle2, Clock, MapPin, Activity, X, FileText,
    ChevronDown
} from 'lucide-react';

interface ClinicalCase {
    id: string;
    facility_id: string;
    syndrome: string;
    severity: string;
    status: string;
    tests: any;
    created_at: string;
}

export default function CasCliniquesAdmin() {
    const supabase = createClient();
    const [cases, setCases] = useState<ClinicalCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [selectedCase, setSelectedCase] = useState<ClinicalCase | null>(null);
    const [statusDropOpen, setStatusDropOpen] = useState(false);
    const [severityDropOpen, setSeverityDropOpen] = useState(false);

    useEffect(() => {
        fetchCases();
        const interval = setInterval(fetchCases, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchCases() {
        setRefreshing(true);
        const { data } = await supabase
            .from('clinical_cases')
            .select('*')
            .order('created_at', { ascending: false });
        setCases(data || []);
        setLoading(false);
        setRefreshing(false);
    }

    // Filtrage
    const filteredCases = useMemo(() => {
        return cases.filter(c => {
            const matchSearch = !searchQuery ||
                c.syndrome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.severity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.tests?.zone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.tests?.patient_id || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchStatus = filterStatus === 'all' || c.status === filterStatus;
            const matchSeverity = filterSeverity === 'all' || c.severity === filterSeverity;
            return matchSearch && matchStatus && matchSeverity;
        });
    }, [cases, searchQuery, filterStatus, filterSeverity]);

    // KPIs
    const totalCases = cases.length;
    const suspects = cases.filter(c => c.status === 'suspect').length;
    const probables = cases.filter(c => c.status === 'probable').length;
    const confirmed = cases.filter(c => c.status === 'confirmed').length;
    const urgents = cases.filter(c => c.severity === 'rouge').length;

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' +
            d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const severityLabel = (s: string) => s === 'rouge' ? 'URGENT' : s === 'jaune' ? 'MODÉRÉ' : 'LÉGER';
    const severityColor = (s: string) => s === 'rouge' ? 'bg-red-50 text-red-600 border-red-200' : s === 'jaune' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200';
    const statusLabel = (s: string) => s === 'suspect' ? 'Suspect' : s === 'probable' ? 'Probable' : 'Confirmé';
    const statusColor = (s: string) => s === 'suspect' ? 'bg-orange-50 text-orange-600 border-orange-200' : s === 'probable' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200';

    // Export CSV pour le ministère
    const exportCSV = () => {
        const headers = ['ID', 'Date', 'Syndrome', 'Sévérité', 'Statut', 'Zone', 'Patient ID', 'Âge', 'Genre', 'Actions'];
        const rows = filteredCases.map(c => [
            c.id.substring(0, 8),
            formatTime(c.created_at),
            c.syndrome,
            c.severity,
            c.status,
            c.tests?.zone || '',
            c.tests?.patient_id || '',
            c.tests?.age || '',
            c.tests?.gender || '',
            (c.tests?.actions || []).join('; '),
        ]);

        const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cas_cliniques_abidjan_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
                <Loader2 className="w-10 h-10 text-keneya-green animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chargement Cas Cliniques...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Cas Cliniques</h1>
                    <p className="text-slate-500 font-medium">Données des centres de santé — prêtes pour transmission au ministère</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchCases} disabled={refreshing} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                        <RefreshCw size={18} className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={exportCSV}
                        disabled={filteredCases.length === 0}
                        className="flex items-center gap-2 bg-keneya-green px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-keneya-green/20 hover:bg-keneya-green/90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download size={18} /> Exporter CSV
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-3xl font-black text-keneya-navy">{totalCases}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Cas</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm">
                    <div className="text-3xl font-black text-orange-500">{suspects}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Suspects</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-yellow-100 shadow-sm">
                    <div className="text-3xl font-black text-yellow-600">{probables}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Probables</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm">
                    <div className="text-3xl font-black text-red-600">{confirmed}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Confirmés</div>
                </div>
                <div className="bg-red-50 p-5 rounded-2xl border border-red-200 shadow-sm">
                    <div className="text-3xl font-black text-red-700">{urgents}</div>
                    <div className="text-xs font-bold text-red-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                        <AlertTriangle size={12} /> Urgents
                    </div>
                </div>
            </div>

            {/* FILTRES */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher syndrome, zone, patient..."
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 font-bold text-sm text-slate-700 focus:outline-none focus:border-keneya-navy transition-all"
                    />
                </div>
                <div className="relative">
                    <button type="button" onClick={() => { setStatusDropOpen(!statusDropOpen); setSeverityDropOpen(false); }}
                        className="bg-white border border-slate-200 rounded-xl py-3 px-4 font-bold text-sm text-slate-700 flex items-center gap-2 hover:border-slate-300 focus:outline-none focus:border-keneya-navy transition-all min-w-[150px] justify-between">
                        <span>{filterStatus === 'all' ? 'Tous statuts' : filterStatus === 'suspect' ? 'Suspect' : filterStatus === 'probable' ? 'Probable' : 'Confirmé'}</span>
                        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${statusDropOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {statusDropOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setStatusDropOpen(false)}></div>
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden min-w-[180px]">
                                {[{ v: 'all', l: 'Tous statuts' }, { v: 'suspect', l: 'Suspect' }, { v: 'probable', l: 'Probable' }, { v: 'confirmed', l: 'Confirmé' }].map(o => (
                                    <button key={o.v} type="button" onClick={() => { setFilterStatus(o.v); setStatusDropOpen(false); }}
                                        className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center justify-between transition-colors ${filterStatus === o.v ? 'bg-keneya-navy/5 text-keneya-navy' : 'text-slate-600 hover:bg-slate-50'}`}>
                                        {o.l}
                                        {filterStatus === o.v && <CheckCircle2 size={16} className="text-keneya-green" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <div className="relative">
                    <button type="button" onClick={() => { setSeverityDropOpen(!severityDropOpen); setStatusDropOpen(false); }}
                        className="bg-white border border-slate-200 rounded-xl py-3 px-4 font-bold text-sm text-slate-700 flex items-center gap-2 hover:border-slate-300 focus:outline-none focus:border-keneya-navy transition-all min-w-[170px] justify-between">
                        <span>{filterSeverity === 'all' ? 'Toutes sévérités' : filterSeverity === 'rouge' ? 'Urgent' : filterSeverity === 'jaune' ? 'Modéré' : 'Léger'}</span>
                        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${severityDropOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {severityDropOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setSeverityDropOpen(false)}></div>
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden min-w-[180px]">
                                {[{ v: 'all', l: 'Toutes sévérités' }, { v: 'rouge', l: 'Urgent (Rouge)' }, { v: 'jaune', l: 'Modéré (Jaune)' }, { v: 'vert', l: 'Léger (Vert)' }].map(o => (
                                    <button key={o.v} type="button" onClick={() => { setFilterSeverity(o.v); setSeverityDropOpen(false); }}
                                        className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center justify-between transition-colors ${filterSeverity === o.v ? 'bg-keneya-navy/5 text-keneya-navy' : 'text-slate-600 hover:bg-slate-50'}`}>
                                        {o.l}
                                        {filterSeverity === o.v && <CheckCircle2 size={16} className="text-keneya-green" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* TABLEAU */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100 bg-slate-50">
                                <th className="p-4 font-black">Date</th>
                                <th className="p-4 font-black">Syndrome</th>
                                <th className="p-4 font-black">Zone</th>
                                <th className="p-4 font-black">Patient</th>
                                <th className="p-4 font-black">Sévérité</th>
                                <th className="p-4 font-black">Statut</th>
                                <th className="p-4 font-black">Actions terrain</th>
                                <th className="p-4 font-black"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCases.length > 0 ? filteredCases.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => setSelectedCase(c)}>
                                    <td className="p-4 text-xs font-bold text-slate-400 whitespace-nowrap">{formatTime(c.created_at)}</td>
                                    <td className="p-4">
                                        <span className="text-sm font-black text-keneya-navy">{c.syndrome}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                            <MapPin size={12} className="text-slate-300" /> {c.tests?.zone || '—'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs font-bold text-slate-600">{c.tests?.patient_id || '—'}</div>
                                        <div className="text-[10px] text-slate-400">
                                            {c.tests?.age ? `${c.tests.age} ans` : ''} {c.tests?.gender ? `• ${c.tests.gender === 'M' ? 'Homme' : 'Femme'}` : ''}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${severityColor(c.severity)}`}>
                                            {severityLabel(c.severity)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusColor(c.status)}`}>
                                            {statusLabel(c.status)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {c.tests?.actions && c.tests.actions.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {c.tests.actions.map((a: string, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">
                                                        {a === 'tdr_palu' ? 'TDR' : a === 'lab_sample' ? 'Labo' : a === 'isolation' ? 'Isolement' : a}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : <span className="text-[10px] text-slate-300">—</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 rounded-lg text-slate-300 group-hover:bg-keneya-navy group-hover:text-white transition-all">
                                            <FileText size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="p-16 text-center">
                                        <HeartPulse size={40} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-sm font-bold text-slate-400">
                                            {searchQuery || filterStatus !== 'all' || filterSeverity !== 'all'
                                                ? 'Aucun cas ne correspond aux filtres.'
                                                : 'Aucun cas clinique enregistré.'}
                                        </p>
                                        <p className="text-xs text-slate-300 mt-1">Les cas apparaissent ici quand un centre de santé ou un agent en enregistre un.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {filteredCases.length} cas affichés sur {totalCases}
                    </span>
                    <span className="text-[10px] text-slate-300 font-bold">
                        Rafraîchissement auto: 30s
                    </span>
                </div>
            </div>

            {/* MODALE DÉTAILS */}
            {selectedCase && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCase(null)}>
                    <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className={`h-2 w-full ${selectedCase.severity === 'rouge' ? 'bg-red-500' : selectedCase.severity === 'jaune' ? 'bg-orange-400' : 'bg-green-500'}`}></div>
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-black text-keneya-navy">Cas #{selectedCase.id.substring(0, 8)}</h2>
                                    <p className="text-sm text-slate-400 font-bold">{formatTime(selectedCase.created_at)}</p>
                                </div>
                                <button onClick={() => setSelectedCase(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Syndrome</div>
                                    <div className="text-sm font-black text-keneya-navy">{selectedCase.syndrome}</div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zone</div>
                                    <div className="text-sm font-black text-keneya-navy">{selectedCase.tests?.zone || '—'}</div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sévérité</div>
                                    <div className={`text-sm font-black uppercase ${selectedCase.severity === 'rouge' ? 'text-red-600' : selectedCase.severity === 'jaune' ? 'text-orange-500' : 'text-green-600'}`}>
                                        {severityLabel(selectedCase.severity)}
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Statut</div>
                                    <div className={`text-sm font-black uppercase ${selectedCase.status === 'confirmed' ? 'text-red-600' : selectedCase.status === 'probable' ? 'text-yellow-600' : 'text-orange-500'}`}>
                                        {statusLabel(selectedCase.status)}
                                    </div>
                                </div>
                            </div>

                            {selectedCase.tests && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Détails Patient</div>
                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                        <div>
                                            <span className="text-slate-400 text-xs">ID: </span>
                                            <span className="font-bold text-slate-700">{selectedCase.tests.patient_id || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 text-xs">Âge: </span>
                                            <span className="font-bold text-slate-700">{selectedCase.tests.age || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 text-xs">Genre: </span>
                                            <span className="font-bold text-slate-700">{selectedCase.tests.gender === 'M' ? 'Homme' : selectedCase.tests.gender === 'F' ? 'Femme' : '—'}</span>
                                        </div>
                                    </div>
                                    {selectedCase.tests.actions && selectedCase.tests.actions.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Actions Terrain</div>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedCase.tests.actions.map((a: string, i: number) => (
                                                    <span key={i} className={`px-3 py-1 rounded-lg text-xs font-bold ${a === 'isolation' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-600'}`}>
                                                        {a === 'tdr_palu' ? 'TDR Paludisme Négatif' : a === 'lab_sample' ? 'Prélèvement Labo' : a === 'isolation' ? 'Isolement Strict' : a}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
