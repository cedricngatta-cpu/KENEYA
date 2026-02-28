'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Shield, Globe, Smartphone, Save, CheckCircle2, Volume2, Database, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const VOICE_OPTIONS = [
    { value: 'adam', label: 'Adam (EleveLabs - Professional)' },
    { value: 'fatou', label: 'Fatou (Local Dialect Optimized)' },
    { value: 'kouassi', label: 'Kouassi (Deep Bass - Reassured)' },
];

const MODEL_OPTIONS = [
    { value: 'claude', label: 'Claude 3.5 Sonnet (Recommandé)' },
    { value: 'gemini', label: 'Gemini 3.1 Pro (Optimisé Français)' },
    { value: 'llama', label: 'Llama 3 70B (Offline Fallback)' },
];

export default function SettingsPage() {
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<'profile' | 'ia' | 'notifications' | 'system'>('ia');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Profile
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    // IA
    const [selectedVoice, setSelectedVoice] = useState('adam');
    const [voiceOpen, setVoiceOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState('claude');
    const [modelOpen, setModelOpen] = useState(false);
    const [languages, setLanguages] = useState<string[]>(['Français', 'Dioula', 'Baoulé', 'Bété', 'Sénoufo']);

    // Notifications
    const [smsAlerts, setSmsAlerts] = useState(true);
    const [syncMshpcmu, setSyncMshpcmu] = useState(true);
    const [clusterThreshold, setClusterThreshold] = useState(5);

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || '');
                const meta = user.user_metadata || {};
                setUserName(meta.name || user.email?.split('@')[0] || 'Agent');
                setSelectedVoice(meta.ai_voice || 'adam');
                setSelectedModel(meta.ai_model || 'claude');
                setLanguages(meta.languages || ['Français', 'Dioula', 'Baoulé', 'Bété', 'Sénoufo']);

                if (meta.sms_alerts !== undefined) setSmsAlerts(meta.sms_alerts);
                if (meta.sync_mshpcmu !== undefined) setSyncMshpcmu(meta.sync_mshpcmu);
                if (meta.cluster_threshold !== undefined) setClusterThreshold(meta.cluster_threshold);
            }
            setIsLoading(false);
        }
        loadProfile();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await supabase.auth.updateUser({
                data: {
                    name: userName,
                    ai_voice: selectedVoice,
                    ai_model: selectedModel,
                    languages,
                    sms_alerts: smsAlerts,
                    sync_mshpcmu: syncMshpcmu,
                    cluster_threshold: clusterThreshold
                }
            });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Erreur param", error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleLanguage = (lang: string) => {
        setLanguages(prev =>
            prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-keneya-navy tracking-tight mb-1">Paramètres du Système</h1>
                    <p className="text-slate-500 font-medium">Configurez votre espace de travail et les préférences de l'IA KENEYA.</p>
                </div>
                <button onClick={handleSave} disabled={isSaving || isLoading}
                    className="px-8 py-3 bg-keneya-navy text-white font-black rounded-2xl shadow-xl hover:bg-keneya-navy-light transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50">
                    {isSaving ? <span className="flex items-center gap-2"><Loader2 size={20} className="animate-spin" /> Enregistrement...</span> : <><Save size={20} /> Enregistrer</>}
                </button>
            </div>

            {showSuccess && (
                <div className="p-4 bg-keneya-green/10 border border-keneya-green/20 rounded-2xl flex items-center gap-3 text-keneya-green font-bold animate-in slide-in-from-top-4">
                    <CheckCircle2 size={20} /> Paramètres mis à jour avec succès.
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3 space-y-2">
                    {[
                        { id: 'profile', label: 'Mon Profil', icon: User },
                        { id: 'ia', label: 'Intelligence Artificielle', icon: Shield },
                        { id: 'notifications', label: 'Alertes & Notifications', icon: Bell },
                        { id: 'system', label: 'Stockage & Système', icon: Database },
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all ${activeTab === tab.id ? 'bg-white text-keneya-navy shadow-md border-l-4 border-keneya-navy' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}>
                            <tab.icon size={20} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-9 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">

                    {activeTab === 'profile' && (
                        <div className="p-8 space-y-8">
                            <h3 className="text-xl font-black text-keneya-navy border-b border-slate-100 pb-4">Informations Personnelles</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Nom de l'Agent</label>
                                    <input type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-keneya-navy outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Identifiant Centre</label>
                                    <input type="text" value="YOPOUGON-OUEST-02" readOnly className="w-full bg-slate-100 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-400 outline-none" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Adresse Email (Login)</label>
                                    <input type="email" value={userEmail} readOnly className="w-full bg-slate-100 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-400 outline-none cursor-not-allowed" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ia' && (
                        <div className="p-8 space-y-8">
                            <h3 className="text-xl font-black text-keneya-navy flex items-center gap-2 border-b border-slate-100 pb-4">
                                <Shield className="text-keneya-green" size={24} /> Configuration du Moteur IA
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">Langues Locales Supportées</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {['Français', 'Dioula', 'Baoulé', 'Bété', 'Sénoufo', 'Gour'].map(lang => (
                                            <label key={lang} className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all group">
                                                <input type="checkbox" checked={languages.includes(lang)} onChange={() => toggleLanguage(lang)} className="w-5 h-5 rounded border-slate-300 text-keneya-navy focus:ring-keneya-navy" />
                                                <span className="text-sm font-bold text-slate-700 group-hover:text-keneya-navy">{lang}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    {/* Voix IA */}
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Volume2 size={16} /> Voix de l'Agent IA
                                        </label>
                                        <div className="relative">
                                            <button type="button" onClick={() => { setVoiceOpen(!voiceOpen); setModelOpen(false); }}
                                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 text-left flex items-center justify-between hover:border-slate-300 focus:outline-none focus:border-keneya-navy transition-all">
                                                <span>{VOICE_OPTIONS.find(v => v.value === selectedVoice)?.label}</span>
                                                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${voiceOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                            {voiceOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setVoiceOpen(false)}></div>
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                                                        {VOICE_OPTIONS.map(v => (
                                                            <button key={v.value} type="button" onClick={() => { setSelectedVoice(v.value); setVoiceOpen(false); }}
                                                                className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center justify-between transition-colors ${selectedVoice === v.value ? 'bg-keneya-navy/5 text-keneya-navy' : 'text-slate-600 hover:bg-slate-50'}`}>
                                                                {v.label}
                                                                {selectedVoice === v.value && <CheckCircle2 size={16} className="text-keneya-green" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Modèle Triage */}
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Globe size={16} /> Modèle de Triage
                                        </label>
                                        <div className="relative">
                                            <button type="button" onClick={() => { setModelOpen(!modelOpen); setVoiceOpen(false); }}
                                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 text-left flex items-center justify-between hover:border-slate-300 focus:outline-none focus:border-keneya-navy transition-all">
                                                <span>{MODEL_OPTIONS.find(m => m.value === selectedModel)?.label}</span>
                                                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${modelOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                            {modelOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setModelOpen(false)}></div>
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                                                        {MODEL_OPTIONS.map(m => (
                                                            <button key={m.value} type="button" onClick={() => { setSelectedModel(m.value); setModelOpen(false); }}
                                                                className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center justify-between transition-colors ${selectedModel === m.value ? 'bg-keneya-navy/5 text-keneya-navy' : 'text-slate-600 hover:bg-slate-50'}`}>
                                                                {m.label}
                                                                {selectedModel === m.value && <CheckCircle2 size={16} className="text-keneya-green" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3 text-orange-800">
                                    <AlertCircle className="shrink-0" size={20} />
                                    <p className="text-xs font-medium leading-relaxed">
                                        Certaines langues comme le <strong>Sénoufo</strong> nécessitent une connexion stable pour une précision de triage optimale (&gt;92%). En mode hors-ligne, le système basculera sur le dictionnaire local.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="p-8 space-y-8">
                            <h3 className="text-xl font-black text-keneya-navy border-b border-slate-100 pb-4">Alertes & Seuil de Triage</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div>
                                        <div className="font-bold text-keneya-navy">Alertes SMS Critiques</div>
                                        <div className="text-xs text-slate-500 font-medium">Recevoir un SMS pour chaque cas classé "ROUGE"</div>
                                    </div>
                                    <div onClick={() => setSmsAlerts(!smsAlerts)} className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition-colors ${smsAlerts ? 'bg-keneya-green' : 'bg-slate-300'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${smsAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div>
                                        <div className="font-bold text-keneya-navy">Synchronisation MSHPCMU</div>
                                        <div className="text-xs text-slate-500 font-medium">Comparer automatiquement avec les bulletins officiels</div>
                                    </div>
                                    <div onClick={() => setSyncMshpcmu(!syncMshpcmu)} className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition-colors ${syncMshpcmu ? 'bg-keneya-green' : 'bg-slate-300'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${syncMshpcmu ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </div>
                                </div>
                                <div className="pt-4 space-y-4">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block pl-1">Seuil de Détection de Cluster</label>
                                    <input type="range" min="3" max="20" value={clusterThreshold} onChange={e => setClusterThreshold(Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-keneya-navy" />
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 px-1">
                                        <span>3 CAS / 2KM²</span>
                                        <span className="text-keneya-navy font-black">ACTUEL : {clusterThreshold} CAS / 2KM² (24H)</span>
                                        <span>20 CAS / 2KM²</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="p-8 space-y-8">
                            <h3 className="text-xl font-black text-keneya-navy border-b border-slate-100 pb-4">État des Quotas & API</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 border border-slate-100 bg-slate-50 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">ElevenLabs (TTS)</div>
                                        <div className="text-xl font-black text-keneya-navy">84,500 / 100k</div>
                                    </div>
                                    <div className="w-12 h-12 bg-keneya-green/20 text-keneya-green rounded-xl flex items-center justify-center"><Smartphone size={24} /></div>
                                </div>
                                <div className="p-5 border border-slate-100 bg-slate-50 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Stockage DB (Postgres)</div>
                                        <div className="text-xl font-black text-keneya-navy">1.2 GB / 5 GB</div>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><Database size={24} /></div>
                                </div>
                            </div>
                            <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400">Console d'Audit</h4>
                                    <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded">Dernière Sync: 12:42</span>
                                </div>
                                <div className="font-mono text-[10px] space-y-1.5 opacity-70">
                                    <p>[2026-02-28 10:42] SYNC: Synchronisation DHIS2 effectuée (0 erreurs)</p>
                                    <p>[2026-02-28 09:15] IA: Redéploiement du modèle Claude 3.5 vers Edge Abidjan-1</p>
                                    <p>[2026-02-28 08:30] AUTH: 12 agents connectés dans le district Grand Abidjan</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
