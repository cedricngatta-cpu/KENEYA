'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    BellRing, Smartphone, MessageCircle, Mic, Send, AlertTriangle,
    Users, MapPin, Globe, CheckCircle2, Activity, Shield, Clock,
    RefreshCw, Loader2, X, Bot, Sparkles, Droplets, Bug
} from 'lucide-react';

const EPIDEMIES = [
    { value: 'all', label: 'Toutes les maladies' },
    { value: 'Dengue', label: 'Dengue', icon: Bug },
    { value: 'Méningite', label: 'Méningite', icon: Activity },
    { value: 'Choléra', label: 'Choléra', icon: Droplets },
    { value: 'COVID-19', label: 'COVID-19 / Grippe', icon: Activity }
];

const ABIDJAN_ZONES = [
    { value: 'all', label: 'Tout Abidjan (Alerte Générale)' },
    { value: 'Abobo', label: 'Abobo' },
    { value: 'Adjamé', label: 'Adjamé' },
    { value: 'Anyama', label: 'Anyama' },
    { value: 'Attécoubé', label: 'Attécoubé' },
    { value: 'Bingerville', label: 'Bingerville' },
    { value: 'Cocody', label: 'Cocody' },
    { value: 'Koumassi', label: 'Koumassi' },
    { value: 'Marcory', label: 'Marcory' },
    { value: 'Plateau', label: 'Plateau' },
    { value: 'Port-Bouët', label: 'Port-Bouët' },
    { value: 'Songon', label: 'Songon' },
    { value: 'Treichville', label: 'Treichville' },
    { value: 'Yopougon', label: 'Yopougon' },
];

interface BroadcastRow {
    id: string;
    channel: string;
    zone: string;
    message: string;
    sent_by: string | null;
    created_at: string;
}

export default function BroadcastAlertsDashboard() {
    const supabase = createClient();

    const [selectedChannel, setSelectedChannel] = useState<'sms' | 'telegram' | 'voice'>('telegram');
    const [targetZone, setTargetZone] = useState('all');
    const [targetEpidemy, setTargetEpidemy] = useState('all');
    const [zoneOpen, setZoneOpen] = useState(false);
    const [epidemyOpen, setEpidemyOpen] = useState(false);
    const [zoneSearch, setZoneSearch] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
    const [specificNumbers, setSpecificNumbers] = useState('');

    const [history, setHistory] = useState<BroadcastRow[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [reportsPerZone, setReportsPerZone] = useState<Record<string, number>>({});
    const [contactsPerZone, setContactsPerZone] = useState<Record<string, number>>({});
    const [totalReports, setTotalReports] = useState(0);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchData() {
        // Historique des diffusions
        const { data: broadcasts } = await supabase
            .from('broadcasts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        setHistory(broadcasts || []);

        // Nombre de signalements et de contacts par zone (pour l'impact estimé)
        const { data: reports } = await supabase.from('reports').select('geo_cell, patient_phone');
        if (reports) {
            const zoneMap: Record<string, number> = {};
            const contactMap: Record<string, Set<string>> = {};

            reports.forEach((r: any) => {
                const z = (r.geo_cell || 'Inconnu').replace('Abidjan-', ''); // Normalisation simple
                zoneMap[z] = (zoneMap[z] || 0) + 1;

                if (r.patient_phone && r.patient_phone.length > 5) {
                    if (!contactMap[z]) contactMap[z] = new Set();
                    contactMap[z].add(r.patient_phone);
                }
            });

            const finalContactMap: Record<string, number> = {};
            Object.keys(contactMap).forEach(z => {
                finalContactMap[z] = contactMap[z].size;
            });

            setReportsPerZone(zoneMap);
            setContactsPerZone(finalContactMap);
            setTotalReports(reports.length);
        }

        setLoadingHistory(false);
    }

    const handleGenerateIAMessage = async () => {
        if (targetEpidemy === 'all' && targetZone === 'all') {
            setMessage("Veuillez d'abord sélectionner au moins une zone ou une épidémie pour que l'IA soit précise.");
            return;
        }

        setIsGeneratingMessage(true);
        try {
            const res = await fetch('/api/notifications/generate-alert-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    zone: targetZone,
                    epidemy: targetEpidemy === 'all' ? 'maladie' : targetEpidemy
                })
            });

            const data = await res.json();
            if (res.ok && data.message) {
                setMessage(data.message);
            } else {
                setMessage("Erreur lors de la génération. Veuillez réessayer.");
            }
        } catch (err) {
            console.error(err);
            setMessage("L'IA est momentanément indisponible.");
        } finally {
            setIsGeneratingMessage(false);
        }
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSending(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (selectedChannel === 'sms') {
                // Notre nouvelle route pour un envoi SMS (qui inclura aussi notre test)
                const res = await fetch('/api/notifications/broadcast-sms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        zone: targetZone,
                        message: message.trim(),
                        senderId: user?.id,
                        specificNumbers: specificNumbers.trim()
                    })
                });

                if (!res.ok) throw new Error("Erreur serveur SMS");

                const result = await res.json();
                console.log("Résultat Envoi:", result);
            } else {
                // Méthode existante (sauvegarde classique)
                await (supabase as any).from('broadcasts').insert({
                    channel: selectedChannel,
                    zone: targetZone,
                    message: message.trim(),
                    sent_by: user?.id || null,
                });
            }

            setIsSending(false);
            setIsSuccess(true);
            fetchData();

            setTimeout(() => {
                setIsSuccess(false);
                setMessage('');
            }, 3000);
        } catch (err) {
            console.error('Erreur envoi:', err);
            setIsSending(false);
            alert("Une erreur est survenue lors de l'envoi.");
        }
    };

    const zoneReports = targetZone === 'all' ? totalReports : (reportsPerZone[targetZone] || 0);

    const formatTime = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'À l\'instant';
        if (mins < 60) return `${mins}min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}j`;
    };

    const channelIcon = (c: string) => c === 'sms' ? <Smartphone size={14} /> : c === 'telegram' ? <MessageCircle size={14} /> : <Mic size={14} />;
    const channelColor = (c: string) => c === 'sms' ? 'bg-blue-50 text-blue-600' : c === 'telegram' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-600';

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="max-w-xl">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-loose mb-1">
                        <span className="flex items-center gap-3">
                            <BellRing className="text-red-500" size={32} />
                            Diffusion d'Alertes
                        </span>
                    </h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Envoyez des consignes sanitaires par SMS, WhatsApp ou Vocal aux populations des zones ciblées.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-500">
                    <Activity size={16} className="text-keneya-green animate-pulse" />
                    {history.length} alertes envoyées
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* FORMULAIRE */}
                <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">

                    {/* Success Overlay */}
                    {isSuccess && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                            <div className="w-24 h-24 bg-keneya-green/20 text-keneya-green rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-2xl font-black text-keneya-navy mb-2">Alerte Diffusée !</h2>
                            <p className="text-slate-500 font-medium text-center max-w-xs">
                                L'alerte a été enregistrée. Elle est en cours d'envoi vers les <b>{targetZone === 'all' ? Object.values(contactsPerZone).reduce((a, b) => a + b, 0) : (contactsPerZone[targetZone] || 0)}</b> numéros de patients enregistrés dans cette zone.
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleBroadcast} className="space-y-8">

                        {/* 1. CANAL */}
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                                1. Canal de communication
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <button type="button" onClick={() => setSelectedChannel('sms')} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${selectedChannel === 'sms' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}>
                                    <Smartphone size={28} />
                                    <span className="font-bold text-sm">SMS Massif</span>
                                </button>
                                <button type="button" onClick={() => setSelectedChannel('telegram')} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${selectedChannel === 'telegram' ? 'border-blue-400 bg-blue-50 text-blue-500' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}>
                                    <MessageCircle size={28} />
                                    <span className="font-bold text-sm">Bot Telegram</span>
                                </button>
                                <button type="button" onClick={() => setSelectedChannel('voice')} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${selectedChannel === 'voice' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}>
                                    <Mic size={28} />
                                    <span className="font-bold text-sm">Appel Vocal</span>
                                </button>
                            </div>
                        </div>

                        {/* 2. ÉPIDÉMIE */}
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Bug size={14} /> 2. Épidémie / Maladie Ciblée (Pour IA)
                            </h3>
                            <div className="relative z-20">
                                <button
                                    type="button"
                                    onClick={() => { setEpidemyOpen(!epidemyOpen); setZoneOpen(false); }}
                                    className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 font-bold text-base rounded-2xl px-5 py-4 text-left flex items-center justify-between focus:outline-none focus:border-keneya-navy hover:border-slate-300 transition-all"
                                >
                                    <span className="flex items-center gap-3">
                                        <Activity size={18} className="text-keneya-red" />
                                        {EPIDEMIES.find(z => z.value === targetEpidemy)?.label || 'Sélectionner une épidémie'}
                                    </span>
                                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${epidemyOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                </button>

                                {epidemyOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setEpidemyOpen(false)}></div>
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 overflow-hidden">
                                            <div className="max-h-56 overflow-y-auto">
                                                {EPIDEMIES.map((z) => {
                                                    const IconCmp = z.icon || Activity;
                                                    return (
                                                        <button
                                                            key={z.value}
                                                            type="button"
                                                            onClick={() => { setTargetEpidemy(z.value); setEpidemyOpen(false); }}
                                                            className={`w-full text-left px-5 py-3 text-sm font-bold flex items-center justify-between transition-colors ${targetEpidemy === z.value
                                                                ? 'bg-keneya-red/5 text-keneya-red'
                                                                : 'text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <span className="flex items-center gap-3">
                                                                <IconCmp size={14} className={targetEpidemy === z.value ? 'text-keneya-red' : 'text-slate-300'} />
                                                                {z.label}
                                                            </span>
                                                            {targetEpidemy === z.value && (
                                                                <CheckCircle2 size={16} className="text-keneya-red" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 3. ZONE */}
                        <div className="relative z-10">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                                3. Ciblage Géographique
                            </h3>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => { setZoneOpen(!zoneOpen); setEpidemyOpen(false); setZoneSearch(''); }}
                                    className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 font-bold text-base rounded-2xl px-5 py-4 text-left flex items-center justify-between focus:outline-none focus:border-keneya-navy hover:border-slate-300 transition-all"
                                >
                                    <span className="flex items-center gap-3">
                                        <MapPin size={18} className="text-slate-400" />
                                        {ABIDJAN_ZONES.find(z => z.value === targetZone)?.label || 'Sélectionner'}
                                    </span>
                                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${zoneOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                </button>

                                {zoneOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setZoneOpen(false)}></div>
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 overflow-hidden">
                                            {/* Recherche */}
                                            <div className="p-3 border-b border-slate-100">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={zoneSearch}
                                                    onChange={(e) => setZoneSearch(e.target.value)}
                                                    placeholder="Rechercher une commune..."
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-keneya-navy"
                                                />
                                            </div>
                                            {/* Liste */}
                                            <div className="max-h-56 overflow-y-auto">
                                                {ABIDJAN_ZONES.filter(z => z.label.toLowerCase().includes(zoneSearch.toLowerCase())).map((z) => (
                                                    <button
                                                        key={z.value}
                                                        type="button"
                                                        onClick={() => { setTargetZone(z.value); setZoneOpen(false); }}
                                                        className={`w-full text-left px-5 py-3 text-sm font-bold flex items-center justify-between transition-colors ${targetZone === z.value
                                                            ? 'bg-keneya-navy/5 text-keneya-navy'
                                                            : 'text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <span className="flex items-center gap-3">
                                                            <MapPin size={14} className={targetZone === z.value ? 'text-keneya-navy' : 'text-slate-300'} />
                                                            {z.label}
                                                        </span>
                                                        {targetZone === z.value && (
                                                            <CheckCircle2 size={16} className="text-keneya-green" />
                                                        )}
                                                    </button>
                                                ))}
                                                {ABIDJAN_ZONES.filter(z => z.label.toLowerCase().includes(zoneSearch.toLowerCase())).length === 0 && (
                                                    <div className="p-4 text-center text-xs text-slate-400">Aucune commune trouvée</div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 3.B NUMÉROS SPÉCIFIQUES (OPTIONNEL) */}
                        <div className="relative z-10">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                                Optionnel : Numéros spécifiques
                            </h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={specificNumbers}
                                    onChange={(e) => setSpecificNumbers(e.target.value)}
                                    placeholder="Ex: 2250104617601, 2250564913501 (séparés par des virgules)"
                                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-keneya-navy transition-colors"
                                />
                                {specificNumbers.trim().length > 0 && (
                                    <p className="mt-2 text-xs font-medium text-amber-600 flex items-center gap-1">
                                        <AlertTriangle size={12} /> La sélection géographique (Zone) sera ignorée. Le message ne sera envoyé qu'à ces numéros.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 4. MESSAGE */}
                        <div className="relative z-0">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    4. Contenu de l'Alerte
                                </h3>

                                <button type="button" onClick={handleGenerateIAMessage} disabled={isGeneratingMessage} className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-purple-100 hover:border-purple-300 transition-colors shadow-sm active:scale-95 disabled:opacity-50">
                                    {isGeneratingMessage ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    Générer avec l'IA
                                </button>
                            </div>
                            <textarea
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tapez votre consigne sanitaire. Ex: Attention, des cas de choléra ont été signalés dans votre quartier. Lavez-vous les mains régulièrement et buvez uniquement de l'eau bouillie."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 min-h-[140px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-keneya-navy transition-colors resize-y"
                            />
                        </div>

                        {/* ENVOYER */}
                        <button
                            type="submit"
                            disabled={isSending || !message.trim()}
                            className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl
                                ${isSending || !message.trim() ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 active:scale-95'}
                            `}
                        >
                            {isSending ? (
                                <><Loader2 size={22} className="animate-spin" /> Diffusion en cours...</>
                            ) : (
                                <><Send size={22} /> {selectedChannel === 'voice' ? 'Lancer les appels' : 'Diffuser le message'}</>
                            )}
                        </button>
                    </form>
                </div>

                {/* SIDEBAR */}
                <div className="lg:col-span-5 space-y-6">

                    {/* Impact estimé */}
                    <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden border border-slate-800">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[40px]"></div>

                        <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
                            <Activity size={18} /> Contexte de la zone
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-slate-400 font-medium mb-1">Zone cible</div>
                                <div className="text-xl font-black text-white">{targetZone === 'all' ? 'Tout Abidjan' : targetZone}</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-slate-400 font-medium mb-1">Signalements</div>
                                <div className="text-2xl font-black text-red-400 flex items-center gap-2">
                                    <AlertTriangle size={18} /> {zoneReports}
                                </div>
                            </div>
                        </div>

                        {/* Prévisualisation */}
                        <div className="bg-white/10 rounded-2xl p-5 border border-white/20 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
                                <div className="w-8 h-8 rounded-full bg-keneya-navy flex items-center justify-center">
                                    <Shield size={16} className="text-white" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white uppercase">Alerte KENEYA</div>
                                    <div className="text-[10px] text-slate-400">Via {selectedChannel.toUpperCase()}</div>
                                </div>
                            </div>
                            <p className="text-sm text-slate-300 italic min-h-[60px]">
                                {message ? `"${message}"` : "Ceci est un aperçu de votre message. Tapez un texte pour le voir ici."}
                            </p>
                            {selectedChannel === 'voice' && message && (
                                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-400 bg-orange-400/10 px-3 py-2 rounded-lg">
                                    <Mic size={14} /> Sera traduit vocalement en langues locales.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Historique */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" /> Dernières alertes envoyées
                            </h3>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between mx-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Smartphone size={18} /></div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Patients</div>
                                    <div className="text-sm font-black text-blue-900">
                                        {targetZone === 'all'
                                            ? Object.values(contactsPerZone).reduce((a, b) => a + b, 0)
                                            : (contactsPerZone[targetZone] || 0)
                                        } Contacts Directs
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Couverture</div>
                                <div className="text-sm font-black text-blue-900">100%</div>
                            </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {loadingHistory ? (
                                <div className="p-8 text-center">
                                    <Loader2 size={20} className="mx-auto text-slate-300 animate-spin" />
                                </div>
                            ) : history.length > 0 ? history.map((b) => (
                                <div key={b.id} className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1 ${channelColor(b.channel)}`}>
                                            {channelIcon(b.channel)} {b.channel}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                            <Clock size={10} /> {formatTime(b.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-600 line-clamp-2">{b.message}</p>
                                    <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                        <MapPin size={10} /> {b.zone === 'all' ? 'Tout Abidjan' : b.zone}
                                    </span>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-sm text-slate-400 italic">
                                    Aucune alerte envoyée
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
