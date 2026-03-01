'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    HeartPulse, FileText, AlertTriangle, Activity,
    Plus, Clock, Users, Loader2, CheckCircle,
    TrendingUp, Stethoscope, ClipboardList, X, RefreshCw,
    ShieldAlert, MapPin, ArrowRight, MessageSquare, Send, User, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

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
    patient_name?: string;
    patient_phone?: string;
    created_at: string;
}

interface ClusterRow {
    id: string;
    geo_cell: string;
    syndrome: string;
    score: number;
    status: string;
    created_at: string;
}

export default function CenterDashboardPage() {
    const supabase = createClient();
    const [cases, setCases] = useState<ClinicalCase[]>([]);
    const [recentReports, setRecentReports] = useState<ReportRow[]>([]);
    const [activeClusters, setActiveClusters] = useState<ClusterRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [centerName, setCenterName] = useState('Centre de Santé');
    const [showNewCase, setShowNewCase] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // SMS IA
    const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);

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

        const [casesRes, reportsRes, clustersRes] = await Promise.all([
            supabase.from('clinical_cases').select('*').order('created_at', { ascending: false }).limit(20),
            supabase.from('reports').select('id, geo_cell, severity, symptoms, patient_name, patient_phone, created_at').order('created_at', { ascending: false }).limit(10),
            supabase.from('clusters').select('*').eq('status', 'active').order('score', { ascending: false }),
        ]);

        setCases(casesRes.data || []);
        setRecentReports(reportsRes.data || []);
        setActiveClusters(clustersRes.data || []);
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

    async function generateSMSText(report: ReportRow) {
        setIsGenerating(true);
        setSelectedReport(report);

        // Coordonnées de test si nécessaire
        const name = report.patient_name || "Mr Marc"; // Mr Marc par défaut pour le test
        const phone = report.patient_phone || "01 04 61 76 01";

        try {
            const res = await fetch('/api/notifications/generate-sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientName: name,
                    gender: 'M', // Mr Marc
                    symptoms: Array.isArray(report.symptoms) ? report.symptoms.join(', ') : 'symptômes non spécifiés',
                    severity: report.severity,
                    hospitalName: centerName
                })
            });
            const data = await res.json();
            setGeneratedMessage(data.message);
        } catch (err) {
            console.error("Erreur génération:", err);
        }
        setIsGenerating(false);
    }

    async function sendSMS() {
        if (!selectedReport || !generatedMessage) return;
        setIsSending(true);

        const phone = selectedReport.patient_phone || "0104617601";

        try {
            const res = await fetch('/api/notifications/sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: phone,
                    message: generatedMessage
                })
            });
            if (res.ok) {
                setSendSuccess(true);
                setTimeout(() => {
                    setSendSuccess(false);
                    setSelectedReport(null);
                }, 2000);
            }
        } catch (err) {
            console.error("Erreur envoi:", err);
        }
        setIsSending(false);
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
    const statusColor = (s: string) => s === 'confirmed' ? 'bg-red-50 text-red-600' : s === 'probable' ? 'bg-orange-50 text-orange-100' : 'bg-blue-50 text-blue-100';

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chargement Centre...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                        Dashboard <span className="text-emerald-600 underline decoration-emerald-200 underline-offset-8">Hospitalier</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-xs md:text-sm mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Connecté : <span className="font-bold text-slate-700">{centerName}</span> • Surveillance
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <Link href="/dashboard/map" className="flex-1 lg:flex-none px-4 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                        <MapPin size={14} className="text-emerald-400" /> Radar
                    </Link>
                    <button onClick={fetchData} disabled={refreshing} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all group">
                        <RefreshCw size={16} className={`text-slate-400 group-hover:text-emerald-600 transition-colors ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowNewCase(true)}
                        className="flex-1 lg:flex-none px-4 py-3 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                        <Plus size={16} /> Nouveau Cas
                    </button>
                </div>
            </div>

            {/* ALERTE CLUSTER (IA) */}
            {activeClusters.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 relative overflow-hidden group animate-in slide-in-from-top-4 duration-700">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/50 rounded-bl-[5rem] -z-0 group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 md:gap-5">
                            <div className="p-3 md:p-4 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/20 animate-pulse">
                                <ShieldAlert size={24} className="md:w-8 md:h-8" />
                            </div>
                            <div>
                                <h2 className="text-lg md:text-xl font-black text-red-900">Alerte Épidémique Majeure</h2>
                                <p className="text-red-700/70 text-xs md:text-sm font-medium">KENEYA a détecté {activeClusters.length} cluster(s) actif(s).</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                            {activeClusters.slice(0, 3).map((cluster) => (
                                <div key={cluster.id} className="bg-white/80 backdrop-blur-md border border-red-200 px-3 py-1.5 md:px-4 md:py-2 rounded-xl flex items-center gap-2 md:gap-3 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                                    <span className="text-[10px] md:text-xs font-black text-red-900 uppercase tracking-tighter">{cluster.geo_cell}</span>
                                    <span className="h-4 w-px bg-red-100"></span>
                                    <span className="text-[10px] md:text-xs font-bold text-slate-500">{cluster.syndrome}</span>
                                </div>
                            ))}
                        </div>
                        <Link href="/dashboard/map" className="w-full xl:w-auto px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                            Carte <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { icon: Stethoscope, label: 'Cas Suspects', value: suspectCount, color: 'text-blue-600 bg-blue-50', border: 'border-blue-100', glow: 'shadow-blue-500/5' },
                    { icon: AlertTriangle, label: 'Cas Probables', value: probableCount, color: 'text-orange-600 bg-orange-50', border: 'border-orange-100', glow: 'shadow-orange-500/5' },
                    { icon: CheckCircle, label: 'Cas Confirmés', value: confirmedCount, color: 'text-red-600 bg-red-50', border: 'border-red-100', glow: 'shadow-red-500/5' },
                    { icon: Activity, label: 'Alertes Citoyennes', value: criticalReports, color: 'text-purple-600 bg-purple-50', border: 'border-purple-100', glow: 'shadow-purple-500/5' },
                ].map((k, i) => (
                    <div key={i} className={`bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border ${k.border} flex items-center gap-4 shadow-sm ${k.glow} hover:-translate-y-1 transition-all`}>
                        <div className={`p-3 md:p-4 rounded-2xl ${k.color}`}><k.icon size={20} className="md:w-6 md:h-6" /></div>
                        <div>
                            <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">{k.value}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Cas Cliniques */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Fichiers Patients & Cas Cliniques ({cases.length})
                        </h3>
                    </div>

                    {cases.length > 0 ? (
                        <div className="space-y-4">
                            {cases.map((c) => (
                                <div key={c.id} className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300">
                                    <div className="flex items-center gap-4 md:gap-5">
                                        <div className={`p-3 md:p-4 rounded-2xl ${severityColor(c.severity)} shadow-sm`}>
                                            <HeartPulse size={20} className="md:w-6 md:h-6" />
                                        </div>
                                        <div>
                                            <div className="font-black text-base md:text-lg text-slate-900 leading-tight mb-1">{c.syndrome}</div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase border ${severityColor(c.severity)} shadow-sm`}>
                                                    {c.severity}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase ${statusColor(c.status)} shadow-sm`}>
                                                    {c.status}
                                                </span>
                                                <span className="text-[9px] md:text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                    <Clock size={10} className="text-slate-300" /> {formatTime(c.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all lg:translate-x-4 lg:group-hover:translate-x-0">
                                        {c.status === 'suspect' && (
                                            <button onClick={() => handleUpdateStatus(c.id, 'probable')}
                                                className="flex-1 sm:flex-none px-3 py-2 bg-orange-50 text-orange-600 text-[9px] font-black uppercase rounded-xl hover:bg-orange-100 transition-all border border-orange-100 shadow-sm">
                                                Probable
                                            </button>
                                        )}
                                        {(c.status === 'suspect' || c.status === 'probable') && (
                                            <button onClick={() => handleUpdateStatus(c.id, 'confirmed')}
                                                className="flex-1 sm:flex-none px-3 py-2 bg-red-50 text-red-600 text-[9px] font-black uppercase rounded-xl hover:bg-red-100 transition-all border border-red-100 shadow-sm">
                                                Confirmer
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 p-20 rounded-[3rem] text-center">
                            <ClipboardList size={48} className="mx-auto text-slate-300 mb-4 opacity-20" />
                            <p className="text-lg font-black text-slate-400">Aucun dossier actif</p>
                            <p className="text-sm text-slate-400 mt-2">Commencez par enregistrer un nouveau cas clinique.</p>
                        </div>
                    )}
                </div>

                {/* Signalements récents de la zone */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Radar de Zone ({recentReports.length})
                        </h3>
                    </div>

                    {recentReports.length > 0 ? (
                        <div className="space-y-4 max-h-[60vh] overflow-auto no-scrollbar pr-2">
                            {recentReports.map((r) => (
                                <div key={r.id} className={`bg-white p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border-l-[6px] border border-slate-100 shadow-sm transition-all hover:scale-[1.02] ${r.severity === 'rouge' ? 'border-l-red-500' : r.severity === 'jaune' ? 'border-l-orange-400' : 'border-l-green-500'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase border ${severityColor(r.severity)}`}>
                                            {r.severity}
                                        </span>
                                        <span className="text-[9px] md:text-[10px] text-slate-400 font-black font-mono bg-slate-50 px-2 py-1 rounded-md">{formatTime(r.created_at)}</span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3 md:gap-4">
                                        <div className="flex items-start gap-2">
                                            <MapPin size={12} className="text-slate-300 mt-1 md:w-[14px] md:h-[14px]" />
                                            <div>
                                                <p className="text-xs md:text-sm font-black text-slate-900 leading-tight">
                                                    {r.geo_cell || 'Zone Abidjan'}
                                                </p>
                                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                                                    {Array.isArray(r.symptoms) ? r.symptoms.slice(0, 2).join(' • ') : 'Symptômes divers'}
                                                </p>
                                                {r.patient_name && (
                                                    <p className="text-[9px] md:text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1">
                                                        <User size={10} /> {r.patient_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => generateSMSText(r)}
                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm shrink-0"
                                            title="Notifier par SMS KENEYA"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center shadow-sm">
                            <FileText size={40} className="mx-auto text-slate-200 mb-4 opacity-30" />
                            <p className="text-sm font-black text-slate-400 italic">Signalements Calmes</p>
                        </div>
                    )}

                    {/* Quick Link Map */}
                    <Link href="/dashboard/map" className="flex flex-col items-center justify-center p-8 bg-keneya-navy rounded-[2.5rem] text-white group relative overflow-hidden shadow-2xl shadow-keneya-navy/20">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-keneya-green/20 rounded-full blur-2xl"></div>
                        <TrendingUp size={32} className="text-keneya-green-light mb-3 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-black uppercase tracking-widest">Voir l'Analyse SIG</span>
                        <span className="text-[10px] font-medium text-slate-400 mt-1">Radar de surveillance global Abidjan</span>
                    </Link>
                </div>
            </div>

            {/* === MODALE NOUVEAU CAS === */}
            {showNewCase && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewCase(false)}>
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-6 md:p-8 shadow-2xl space-y-5 md:space-y-6 relative overflow-y-auto max-h-[90vh] no-scrollbar" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-3">
                                <HeartPulse size={24} className="text-emerald-600" /> Nouveau Cas
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

            {/* === MODALE NOTIFICATION SMS IA === */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300 pointer-events-auto" onClick={() => setSelectedReport(null)}>
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] w-full max-w-lg p-6 md:p-8 shadow-2xl space-y-4 md:space-y-6 relative overflow-hidden ring-1 ring-slate-100 max-h-[95vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 md:p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <MessageSquare size={20} className="md:w-6 md:h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg md:text-xl font-black text-slate-900 leading-tight">Notification <span className="text-emerald-600">KENEYA</span></h2>
                                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Communication Patient</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destinataire</span>
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${severityColor(selectedReport.severity)}`}>
                                        Alerte {selectedReport.severity}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-emerald-600 font-black">
                                        {(selectedReport.patient_name || 'Mr Marc').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-900">{selectedReport.patient_name || 'Mr Marc (Test)'}</div>
                                        <div className="text-[10px] font-bold text-slate-400">{selectedReport.patient_phone || '01 04 61 76 01'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 flex items-center gap-2">
                                    Message Généré par KENEYA
                                    {isGenerating && <Loader2 size={12} className="animate-spin text-emerald-500" />}
                                </label>
                                <textarea
                                    value={generatedMessage}
                                    onChange={(e) => setGeneratedMessage(e.target.value)}
                                    rows={4}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none shadow-inner"
                                    placeholder="Génération en cours..."
                                />
                                <p className="text-[9px] text-slate-400 font-medium px-2 italic">
                                    Ce message a été optimisé par KENEYA en fonction des symptômes détectés. Vous pouvez le modifier avant l'envoi.
                                </p>
                            </div>
                        </div>

                        {sendSuccess ? (
                            <div className="py-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center group">
                                <CheckCircle size={32} className="mx-auto text-emerald-600 mb-2 animate-bounce" />
                                <p className="text-sm font-black text-emerald-900 uppercase tracking-widest">SMS Envoyé avec Succès !</p>
                            </div>
                        ) : (
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={sendSMS}
                                    disabled={isSending || isGenerating || !generatedMessage}
                                    className="flex-[2] py-4 bg-emerald-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    {isSending ? 'Envoi...' : 'Envoyer Notification'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
