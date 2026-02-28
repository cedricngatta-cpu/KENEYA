'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Settings, Shield, Bell, BrainCircuit,
    Database, Save, RotateCcw, Lock, Eye,
    EyeOff, Loader2, CheckCircle, RefreshCw,
    Activity, AlertTriangle, Clock, Trash2,
    HardDrive, Users, FileText, Zap
} from 'lucide-react';

interface SystemStats {
    totalUsers: number;
    totalReports: number;
    totalTriages: number;
    totalAlerts: number;
    totalClusters: number;
    totalClinicalCases: number;
    dbStatus: 'ok' | 'error';
    latencyMs: number;
}

interface ConfigState {
    alert_threshold: number;
    ai_confidence_threshold: number;
    human_moderation: boolean;
    auto_validation_critical: boolean;
    whatsapp_notifications: boolean;
    double_auth: boolean;
}

const DEFAULT_CONFIG: ConfigState = {
    alert_threshold: 5,
    ai_confidence_threshold: 85,
    human_moderation: true,
    auto_validation_critical: true,
    whatsapp_notifications: true,
    double_auth: false,
};

export default function AdminSystemPage() {
    const supabase = createClient();
    const [showApiKey, setShowApiKey] = useState(false);
    const [showAnonKey, setShowAnonKey] = useState(false);
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [config, setConfig] = useState<ConfigState>(DEFAULT_CONFIG);
    const [initialConfig, setInitialConfig] = useState<ConfigState>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [purging, setPurging] = useState(false);
    const [purged, setPurged] = useState(false);

    const hasChanges = JSON.stringify(config) !== JSON.stringify(initialConfig);

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchAll() {
        await Promise.all([fetchStats(), fetchConfig()]);
        setLoading(false);
    }

    async function fetchStats() {
        setRefreshing(true);
        const startTime = Date.now();
        try {
            const [usersR, reportsR, triageR, alertsR, clustersR, clinicalR] = await Promise.all([
                supabase.from('users').select('id', { count: 'exact', head: true }),
                supabase.from('reports').select('id', { count: 'exact', head: true }),
                supabase.from('triage_results').select('id', { count: 'exact', head: true }),
                supabase.from('alerts').select('id', { count: 'exact', head: true }),
                supabase.from('clusters').select('id', { count: 'exact', head: true }),
                supabase.from('clinical_cases').select('id', { count: 'exact', head: true }),
            ]);
            const latency = Date.now() - startTime;

            setStats({
                totalUsers: usersR.count || 0,
                totalReports: reportsR.count || 0,
                totalTriages: triageR.count || 0,
                totalAlerts: alertsR.count || 0,
                totalClusters: clustersR.count || 0,
                totalClinicalCases: clinicalR.count || 0,
                dbStatus: 'ok',
                latencyMs: latency,
            });
        } catch {
            setStats({ totalUsers: 0, totalReports: 0, totalTriages: 0, totalAlerts: 0, totalClusters: 0, totalClinicalCases: 0, dbStatus: 'error', latencyMs: 0 });
        } finally {
            setRefreshing(false);
        }
    }

    async function fetchConfig() {
        const { data } = await supabase.from('system_config').select('key, value');
        if (data && data.length > 0) {
            const c: any = { ...DEFAULT_CONFIG };
            data.forEach((row: any) => {
                if (row.key === 'alert_threshold') c.alert_threshold = parseInt(row.value);
                else if (row.key === 'ai_confidence_threshold') c.ai_confidence_threshold = parseInt(row.value);
                else if (row.key === 'human_moderation') c.human_moderation = row.value === 'true';
                else if (row.key === 'auto_validation_critical') c.auto_validation_critical = row.value === 'true';
                else if (row.key === 'whatsapp_notifications') c.whatsapp_notifications = row.value === 'true';
                else if (row.key === 'double_auth') c.double_auth = row.value === 'true';
            });
            setConfig(c);
            setInitialConfig(c);
        }
    }

    async function handleSave() {
        setSaving(true);
        const entries = [
            { key: 'alert_threshold', value: String(config.alert_threshold) },
            { key: 'ai_confidence_threshold', value: String(config.ai_confidence_threshold) },
            { key: 'human_moderation', value: String(config.human_moderation) },
            { key: 'auto_validation_critical', value: String(config.auto_validation_critical) },
            { key: 'whatsapp_notifications', value: String(config.whatsapp_notifications) },
            { key: 'double_auth', value: String(config.double_auth) },
        ];

        for (const entry of entries) {
            await (supabase as any).from('system_config').upsert(entry, { onConflict: 'key' });
        }

        setInitialConfig({ ...config });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    }

    function handleReset() {
        setConfig({ ...initialConfig });
    }

    async function handlePurgeResolvedClusters() {
        setPurging(true);
        await supabase.from('clusters').delete().eq('status', 'resolved');
        await fetchStats();
        setPurging(false);
        setPurged(true);
        setTimeout(() => setPurged(false), 2500);
    }

    const Toggle = ({ value, onChange, label, description, danger }: { value: boolean; onChange: (v: boolean) => void; label: string; description: string; danger?: boolean }) => (
        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${danger ? (value ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-100') : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex flex-col">
                <span className={`text-xs font-black uppercase ${danger ? 'text-red-600' : 'text-slate-900'}`}>{label}</span>
                <span className={`text-[10px] font-medium italic ${danger ? 'text-red-400' : 'text-slate-400'}`}>{description}</span>
            </div>
            <button
                onClick={() => onChange(!value)}
                className={`w-12 h-6 rounded-full p-1 flex transition-all duration-300 cursor-pointer ${value ? (danger ? 'bg-red-500 justify-end shadow-lg shadow-red-500/20' : 'bg-keneya-green justify-end shadow-lg shadow-keneya-green/20') : 'bg-slate-300 justify-start'}`}
            >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
                <Loader2 className="w-10 h-10 text-keneya-green animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chargement Configuration...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-700 pb-20 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-slate-900 text-white rounded-[1.8rem]">
                        <Settings size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Configuration <span className="text-slate-500">Système</span></h1>
                        <p className="text-slate-500 font-medium">Réglages, monitoring et sécurité de la plateforme KENEYA.</p>
                    </div>
                </div>
                {hasChanges && (
                    <span className="px-3 py-1.5 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-orange-100 animate-pulse">
                        Modifications non sauvées
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* === État de la Base de Données === */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Database className="text-keneya-green" size={20} /> Base de Données
                        </h3>
                        <button onClick={fetchStats} disabled={refreshing}
                            className="p-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all">
                            <RefreshCw size={14} className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Utilisateurs', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500 bg-blue-50' },
                            { label: 'Signalements', value: stats?.totalReports || 0, icon: FileText, color: 'text-orange-500 bg-orange-50' },
                            { label: 'Triages IA', value: stats?.totalTriages || 0, icon: BrainCircuit, color: 'text-purple-500 bg-purple-50' },
                            { label: 'Alertes', value: stats?.totalAlerts || 0, icon: Bell, color: 'text-red-500 bg-red-50' },
                            { label: 'Clusters', value: stats?.totalClusters || 0, icon: AlertTriangle, color: 'text-amber-500 bg-amber-50' },
                            { label: 'Cas Cliniques', value: stats?.totalClinicalCases || 0, icon: Activity, color: 'text-emerald-500 bg-emerald-50' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className={`p-2 rounded-xl ${item.color}`}><item.icon size={14} /></div>
                                <div>
                                    <div className="text-lg font-black text-slate-900 leading-none">{item.value}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <div className={`flex items-center justify-between p-3 rounded-xl ${stats?.dbStatus === 'ok' ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${stats?.dbStatus === 'ok' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                <span className={`text-xs font-black uppercase tracking-widest ${stats?.dbStatus === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                                    Supabase: {stats?.dbStatus === 'ok' ? 'Connecté' : 'Erreur'}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock size={10} /> {stats?.latencyMs || 0}ms
                            </span>
                        </div>
                    </div>
                </div>

                {/* === Paramètres IA === */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <BrainCircuit className="text-purple-600" size={20} /> Paramètres IA & Triage
                    </h3>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                Seuil d'Alerte District
                                <span className="text-keneya-navy font-bold normal-case text-sm">{config.alert_threshold} cas / 24h</span>
                            </label>
                            <input
                                type="range"
                                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-keneya-navy"
                                min="1" max="20"
                                value={config.alert_threshold}
                                onChange={(e) => setConfig({ ...config, alert_threshold: parseInt(e.target.value) })}
                            />
                            <div className="flex justify-between text-[9px] font-bold text-slate-300 uppercase">
                                <span>1 (Sensible)</span><span>20 (Tolérant)</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                Confiance IA Minimum
                                <span className="text-purple-600 font-bold normal-case text-sm">{config.ai_confidence_threshold}%</span>
                            </label>
                            <input
                                type="range"
                                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-600"
                                min="50" max="99"
                                value={config.ai_confidence_threshold}
                                onChange={(e) => setConfig({ ...config, ai_confidence_threshold: parseInt(e.target.value) })}
                            />
                            <div className="flex justify-between text-[9px] font-bold text-slate-300 uppercase">
                                <span>50% (Permissif)</span><span>99% (Strict)</span>
                            </div>
                        </div>

                        <Toggle
                            value={config.human_moderation}
                            onChange={(v) => setConfig({ ...config, human_moderation: v })}
                            label="Modération Humaine"
                            description="Validation manuelle avant chaque alerte standard"
                        />

                        <Toggle
                            value={config.auto_validation_critical}
                            onChange={(v) => setConfig({ ...config, auto_validation_critical: v })}
                            label="Auto-Validation Critique"
                            description="Bypass admin si confiance IA > seuil & sévérité critique"
                            danger
                        />
                    </div>
                </div>

                {/* === Sécurité === */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Lock className="text-slate-900" size={20} /> Sécurité & Clés API
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Supabase URL</label>
                            <div className="relative">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    readOnly
                                    value={process.env.NEXT_PUBLIC_SUPABASE_URL || ''}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-4 pr-12 text-xs font-mono text-slate-500 focus:outline-none"
                                />
                                <button
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-keneya-navy transition-colors"
                                >
                                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Clé Publique (Anon)</label>
                            <div className="relative">
                                <input
                                    type={showAnonKey ? 'text' : 'password'}
                                    readOnly
                                    value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : ''}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-4 pr-12 text-xs font-mono text-slate-500 focus:outline-none"
                                />
                                <button
                                    onClick={() => setShowAnonKey(!showAnonKey)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-keneya-navy transition-colors"
                                >
                                    {showAnonKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <Toggle
                            value={config.double_auth}
                            onChange={(v) => setConfig({ ...config, double_auth: v })}
                            label="Double Authentification"
                            description="2FA obligatoire pour les administrateurs"
                        />
                    </div>
                </div>

                {/* === Notifications & Maintenance === */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Bell className="text-keneya-navy" size={20} /> Notifications & Maintenance
                    </h3>

                    <div className="space-y-4">
                        <Toggle
                            value={config.whatsapp_notifications}
                            onChange={(v) => setConfig({ ...config, whatsapp_notifications: v })}
                            label="Canal WhatsApp Admin"
                            description="Notifications push via WhatsApp Business API"
                        />

                        <div className="h-px w-full bg-slate-100"></div>

                        <div className="space-y-3">
                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest">Maintenance</div>

                            <button
                                onClick={handlePurgeResolvedClusters}
                                disabled={purging}
                                className="w-full flex items-center justify-between p-4 rounded-2xl border border-dashed border-red-200 hover:bg-red-50 transition-all group cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
                                        {purging ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </div>
                                    <div className="text-left">
                                        <span className="text-xs font-bold text-red-600 block">Purger les Clusters Résolus</span>
                                        <span className="text-[9px] text-red-400">Supprime les anciens clusters marqués comme résolus</span>
                                    </div>
                                </div>
                                {purged && <span className="text-[10px] font-black text-green-600 uppercase">✓ Purgé</span>}
                            </button>

                            <button
                                onClick={fetchStats}
                                className="w-full flex items-center gap-3 p-4 rounded-2xl border border-dashed border-slate-200 hover:bg-slate-50 transition-all group cursor-pointer"
                            >
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-keneya-navy group-hover:text-white transition-colors">
                                    <RefreshCw size={14} />
                                </div>
                                <div className="text-left">
                                    <span className="text-xs font-bold text-slate-700 block">Rafraîchir les Statistiques</span>
                                    <span className="text-[9px] text-slate-400">Recharger tous les compteurs depuis Supabase</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions - Sticky */}
            <div className={`flex items-center justify-between bg-white/80 backdrop-blur-md border p-6 rounded-[2rem] sticky bottom-8 shadow-2xl transition-all ${hasChanges ? 'border-orange-200' : 'border-white/20'}`}>
                <div className="text-xs text-slate-400 font-medium">
                    {hasChanges ? (
                        <span className="text-orange-600 font-bold">Modifications en attente</span>
                    ) : (
                        <span>Tous les paramètres sont sauvegardés</span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleReset}
                        disabled={!hasChanges}
                        className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors rounded-2xl ${hasChanges ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className={`px-10 py-4 font-black text-sm uppercase tracking-widest rounded-2xl flex items-center gap-3 shadow-xl transition-all active:scale-95
                            ${hasChanges
                                ? 'bg-keneya-navy text-white shadow-keneya-navy/20 hover:scale-[1.02]'
                                : saved
                                    ? 'bg-keneya-green text-white shadow-keneya-green/20'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            }`}
                    >
                        {saving ? <><Loader2 size={20} className="animate-spin" /> Sauvegarde...</> :
                            saved ? <><CheckCircle size={20} /> Enregistré !</> :
                                <><Save size={20} /> Enregistrer</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
