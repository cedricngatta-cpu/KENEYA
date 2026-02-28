'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    User, MapPin, Activity, Thermometer, Droplets, Wind, Syringe, Eye, Brain,
    CheckCircle2, Save, Clock, Users, Stethoscope, TestTube, AlertCircle,
    Loader2, FileText, Mic, Waves, Bot, Zap
} from 'lucide-react';

const ABIDJAN_ZONES = [
    'Abobo', 'Adjamé', 'Anyama', 'Attécoubé', 'Bingerville',
    'Cocody', 'Koumassi', 'Marcory', 'Plateau', 'Port-Bouët',
    'Songon', 'Treichville', 'Yopougon'
];

const SYNDROMES = [
    { id: 'fievre', label: 'Fièvre Cible', icon: Thermometer, color: 'text-orange-500' },
    { id: 'respi', label: 'Respiratoire', icon: Wind, color: 'text-teal-500' },
    { id: 'diarrhee', label: 'Digestif Sév.', icon: Droplets, color: 'text-blue-500' },
    { id: 'eruptif', label: 'Éruptif', icon: Eye, color: 'text-pink-500' },
    { id: 'neuro', label: 'Neurologique', icon: Brain, color: 'text-purple-500' },
    { id: 'hemorragique', label: 'Hémorragique', icon: Syringe, color: 'text-red-500' },
];

export default function FastAgentForm() {
    const supabase = createClient();

    const [patientId, setPatientId] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'M' | 'F'>('M');
    const [zone, setZone] = useState('');
    const [gravity, setGravity] = useState<'vert' | 'jaune' | 'rouge'>('jaune');
    const [syndrome, setSyndrome] = useState('');
    const [caseStatus, setCaseStatus] = useState<'suspect' | 'probable' | 'confirmed'>('suspect');
    const [actions, setActions] = useState<string[]>([]);

    const [zoneOpen, setZoneOpen] = useState(false);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [recentCount, setRecentCount] = useState(0);
    const [todayCount, setTodayCount] = useState(0);

    // États IA Vocale
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    // Initialisation de Web Speech API
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recog = new SpeechRecognition();
                recog.continuous = false; // S'arrête après un silence
                recog.interimResults = true; // Montre les résultats partiels
                recog.lang = 'fr-CI'; // Français Ivoirien

                recog.onresult = (event: any) => {
                    let finalTranscript = '';
                    let interimTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (finalTranscript || interimTranscript) {
                        setTranscript(finalTranscript || interimTranscript);
                    }
                };

                recog.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsListening(false);
                    setAiAnalyzing(false);
                };

                recog.onend = () => {
                    setIsListening(false);
                    // Déclenche l'analyse quand on arrête de parler
                    setAiAnalyzing(true);
                };

                setRecognition(recog);
            } else {
                console.warn("L'API SpeechRecognition n'est pas supportée sur ce navigateur.");
            }
        }
    }, []);

    // Fonction d'Analyse Sémanthique Rapide
    useEffect(() => {
        if (aiAnalyzing && transcript) {
            // Petite pause artificielle pour "l'effet IA"
            const timer = setTimeout(() => {
                analyzeTranscriptAndFill(transcript);
                setAiAnalyzing(false);
                // On garde la transcription visible 3 secondes, ou on l'efface
                // setTranscript('');
            }, 1500);
            return () => clearTimeout(timer);
        } else if (aiAnalyzing && !transcript) {
            setAiAnalyzing(false);
        }
    }, [aiAnalyzing, transcript]);

    const analyzeTranscriptAndFill = (text: string) => {
        const lowerText = text.toLowerCase();

        // 1. Extraction de l'Âge (ex: "45 ans", "age 12")
        const ageMatch = lowerText.match(/(\d+)\s*(ans|an)/);
        if (ageMatch && ageMatch[1]) setAge(ageMatch[1]);

        // 1.5 Extraction du Genre (Homme/Femme)
        if (lowerText.match(/\b(homme|garçon|garcon|monsieur|vieux)\b/)) {
            setGender('M');
        } else if (lowerText.match(/\b(femme|fille|dame|vieille|patiente)\b/)) {
            setGender('F');
        }

        // 2. Extraction de la Zone
        const foundZone = ABIDJAN_ZONES.find(z => lowerText.includes(z.toLowerCase()));
        if (foundZone) setZone(foundZone);

        // 3. Classification Syndromique
        let detectedSyndrome = '';
        let detectedGravity: 'vert' | 'jaune' | 'rouge' = 'jaune';

        if (lowerText.includes('fièvre') || lowerText.includes('fievre') || lowerText.includes('chaud')) {
            detectedSyndrome = 'fievre';
            if (lowerText.includes('forte') || lowerText.includes('très') || lowerText.includes('40')) detectedGravity = 'rouge';
        }
        if (lowerText.includes('diarrhée') || lowerText.includes('vomissement') || lowerText.includes('choléra')) {
            detectedSyndrome = 'diarrhee';
            if (lowerText.includes('sang') || lowerText.includes('déshydrat')) detectedGravity = 'rouge';
        }
        if (lowerText.includes('toux') || lowerText.includes('respire mal') || lowerText.includes('essoufflé') || lowerText.includes('respiratoire')) {
            detectedSyndrome = 'respi';
            if (lowerText.includes('sang') || lowerText.includes('étouffe')) detectedGravity = 'rouge';
        }
        if (lowerText.includes('bouton') || lowerText.includes('plaque') || lowerText.includes('éruption') || lowerText.includes('variole')) {
            detectedSyndrome = 'eruptif';
        }
        if (lowerText.includes('convulsion') || lowerText.includes('paralysie') || lowerText.includes('conscience') || lowerText.includes('neurologique')) {
            detectedSyndrome = 'neuro';
            detectedGravity = 'rouge';
        }
        if (lowerText.includes('saigne') || lowerText.includes('hémorragie') || lowerText.includes('ebola') || lowerText.includes('marburg')) {
            detectedSyndrome = 'hemorragique';
            detectedGravity = 'rouge';
        }

        if (detectedSyndrome) setSyndrome(detectedSyndrome);

        // 4. Extraction Gravité Explicite (Surcharge)
        if (lowerText.match(/\b(léger|legere|leger|faible)\b/)) detectedGravity = 'vert';
        else if (lowerText.match(/\b(modéré|modere|moyen)\b/)) detectedGravity = 'jaune';
        else if (lowerText.match(/\b(urgent|urgence|sévère|severe|grave|critique)\b/)) detectedGravity = 'rouge';
        setGravity(detectedGravity);

        // 5. Statut Epidémiologique
        if (lowerText.match(/\b(confirmé|confirme|positif|avéré)\b/)) setCaseStatus('confirmed');
        else if (lowerText.match(/\b(probable|fortes chances|très probable)\b/)) setCaseStatus('probable');
        else if (lowerText.match(/\b(suspect|doute|incertain)\b/)) setCaseStatus('suspect');

        // 6. Actions et Tests
        const newActions: string[] = [];
        if (lowerText.match(/\b(palu(disme)? négatif|tdr négatif|tdr palu)\b/)) newActions.push('tdr_palu');
        if (lowerText.match(/\b(prélèvement|prelevement|échantillon|echantillon|laboratoire)\b/)) newActions.push('lab_sample');
        if (lowerText.match(/\b(isolé|isole|isolement|quarantaine)\b/)) newActions.push('isolation');
        if (newActions.length > 0) setActions(prev => Array.from(new Set([...prev, ...newActions])));

        // 7. Génération Automatique de l'ID Patient (plus besoin de le dicter)
        if (!patientId) {
            setPatientId('ID-AUTO-' + Math.floor(1000 + Math.random() * 9000));
        }
    };

    // Fonction de simulation IA Vocale
    // Lancement écoute réelle
    const handleVoiceCommand = () => {
        if (!recognition) {
            alert("Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome ou Safari.");
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            setTranscript('');
            setIsListening(true);
            try {
                recognition.start();
            } catch (e) {
                console.error("Already started", e);
            }
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: todayC } = await supabase
            .from('reports')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        const { count: totalC } = await supabase
            .from('reports')
            .select('id', { count: 'exact', head: true });

        setTodayCount(todayC || 0);
        setRecentCount(totalC || 0);
    }

    const toggleAction = (actionId: string) => {
        setActions(prev => prev.includes(actionId) ? prev.filter(a => a !== actionId) : [...prev, actionId]);
    };

    const resetForm = () => {
        setPatientId('');
        setAge('');
        setSyndrome('');
        setGravity('jaune');
        setCaseStatus('suspect');
        setZone('');
        setActions([]);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!patientId || !age || !zone || !syndrome) {
            setErrorMessage('Veuillez remplir tous les champs obligatoires (ID, Âge, Zone et Syndrome).');
            setStatus('error');
            setTimeout(() => setStatus('idle'), 4000);
            return;
        }

        setStatus('saving');
        setErrorMessage('');

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Trouver le label du syndrome
            const syndromeLabel = SYNDROMES.find(s => s.id === syndrome)?.label || syndrome;

            // 1. Créer un signalement (report)
            const { error: reportError } = await (supabase as any).from('reports').insert({
                user_id: user?.id || null,
                symptoms: [syndromeLabel, ...actions],
                geo_cell: zone,
                severity: gravity,
            });

            if (reportError) throw reportError;

            // 2. Créer un cas clinique associé
            const { error: caseError } = await (supabase as any).from('clinical_cases').insert({
                facility_id: user?.id || '',
                syndrome: syndromeLabel,
                severity: gravity,
                status: caseStatus,
                tests: {
                    patient_id: patientId,
                    age: parseInt(age),
                    gender: gender,
                    zone: zone,
                    actions: actions,
                },
            });

            if (caseError) throw caseError;

            setStatus('saved');
            fetchStats();

            setTimeout(() => {
                setStatus('idle');
                resetForm();
            }, 2500);

        } catch (err: any) {
            console.error('Erreur sauvegarde:', err);
            setErrorMessage(err.message || 'Erreur lors de la transmission.');
            setStatus('error');
            setTimeout(() => setStatus('idle'), 4000);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-black text-keneya-navy tracking-tight">Saisie Cas Clinique</h1>
                    <p className="text-slate-500 font-medium">Formulaire épidémiologique — données transmises en temps réel au SIG.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-600">
                        <FileText size={16} className="text-keneya-green" /> {todayCount} <span className="text-slate-400">aujourd'hui</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-600">
                        <Activity size={16} className="text-blue-500" /> {recentCount} <span className="text-slate-400">total</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Module IA Vocale - Le Coeur de la Détection Rapide */}
                <div className="p-8 bg-slate-900 border-b border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-keneya-green/5 rounded-full blur-[80px]"></div>

                    <div className="relative flex flex-col md:flex-row items-center gap-6">
                        <button
                            type="button"
                            onClick={handleVoiceCommand}
                            disabled={isListening || aiAnalyzing}
                            className={`shrink-0 w-20 h-20 rounded-full flex items-center justify-center transition-all bg-keneya-green relative shadow-[0_0_40px_rgba(26,188,156,0.3)] hover:scale-105 active:scale-95 z-10`}
                        >
                            {isListening ? (
                                <div className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin"></div>
                            ) : null}
                            <Mic size={32} className="text-white" />
                        </button>

                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-lg font-black text-white flex items-center justify-center md:justify-start gap-2 mb-2">
                                <Bot size={20} className="text-keneya-green-light" /> Assistant Vocal KENEYA
                            </h2>

                            {!isListening && !aiAnalyzing && !transcript && (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-slate-400">
                                        Appuyez sur le micro et dictez les symptômes. L'IA remplira le formulaire instantanément pour une <strong className="text-white">détection ultra-rapide</strong>.
                                    </p>
                                    <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                                        <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700">Mots-clés supportés :</span>
                                        <span className="bg-keneya-green/20 text-keneya-green-light px-2 py-1 rounded-md">"45 ans"</span>
                                        <span className="bg-pink-500/20 text-pink-400 px-2 py-1 rounded-md">"Femme / Homme"</span>
                                        <span className="bg-keneya-navy/50 text-slate-300 px-2 py-1 rounded-md">"Abobo" (Zone)</span>
                                        <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-md">"Fièvre / Diarrhée"</span>
                                        <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded-md">"Cas urgent confirmé"</span>
                                        <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-md">"TDR Palu négatif et isolé"</span>
                                    </div>
                                </div>
                            )}

                            {isListening && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-keneya-green font-bold text-sm animate-pulse">
                                        <Waves size={16} /> Écoute en cours...
                                    </div>
                                    <p className="text-lg text-white font-medium italic">"{transcript}"</p>
                                </div>
                            )}

                            {aiAnalyzing && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-orange-400 font-bold text-sm animate-pulse">
                                        <Zap size={16} /> Analyse sémantique & Détection d'épidémie...
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                                        <div className="bg-orange-400 h-full w-full animate-[progress_1.5s_ease-in-out]"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-slate-100 flex items-center">
                    <div className={`h-full transition-all duration-500 ${status === 'saved' ? 'bg-keneya-green w-full' : status === 'saving' ? 'bg-keneya-navy w-3/4 animate-pulse' : status === 'error' ? 'bg-red-500 w-full' : 'bg-transparent w-full'}`}></div>
                </div>

                <form onSubmit={handleSave} className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-0">

                    {/* COLONNE GAUCHE */}
                    <div className="lg:col-span-5 space-y-8">
                        <div>
                            <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                                <User size={16} /> Patient (Tél. ou ID)
                            </label>
                            <input
                                autoFocus
                                required
                                type="text"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                placeholder="Numéro de téléphone ou N° Dossier"
                                className="w-full text-lg font-bold text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-keneya-navy focus:bg-white transition-colors placeholder:text-slate-300"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                                    <Users size={16} /> Âge
                                </label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    placeholder="Ex: 34"
                                    className="w-full text-lg font-bold text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-keneya-navy focus:bg-white transition-colors"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Genre</label>
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full">
                                    <button type="button" onClick={() => setGender('M')} className={`flex-1 py-3 font-black text-sm rounded-xl transition-all ${gender === 'M' ? 'bg-white text-keneya-navy shadow-sm' : 'text-slate-400'}`}>H</button>
                                    <button type="button" onClick={() => setGender('F')} className={`flex-1 py-3 font-black text-sm rounded-xl transition-all ${gender === 'F' ? 'bg-white text-keneya-navy shadow-sm' : 'text-slate-400'}`}>F</button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                                <MapPin size={16} /> District / Zone
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setZoneOpen(!zoneOpen)}
                                    className="w-full text-left text-lg font-bold text-slate-700 bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-keneya-navy focus:bg-white transition-colors flex items-center justify-between shadow-sm"
                                >
                                    <span className={zone ? 'text-slate-900' : 'text-slate-300'}>{zone || "Sélectionner une zone"}</span>
                                    <div className={`transition-transform duration-200 ${zoneOpen ? 'rotate-180' : ''}`}>
                                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-500 block"></div>
                                    </div>
                                </button>

                                {zoneOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setZoneOpen(false)}></div>
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden z-20 max-h-60 overflow-y-auto">
                                            {ABIDJAN_ZONES.map((z) => (
                                                <button
                                                    key={z}
                                                    type="button"
                                                    onClick={() => { setZone(z); setZoneOpen(false); }}
                                                    className={`w-full text-left px-5 py-3 text-base font-bold transition-colors ${zone === z ? 'bg-keneya-navy/5 text-keneya-navy' : 'text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    {z}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                                <Thermometer size={16} /> Gravité (Triage)
                            </label>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setGravity('vert')} className={`cursor-pointer flex-1 py-3 flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${gravity === 'vert' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-green-300'}`}>
                                    <span className="font-black">Léger</span>
                                </button>
                                <button type="button" onClick={() => setGravity('jaune')} className={`cursor-pointer flex-1 py-3 flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${gravity === 'jaune' ? 'bg-yellow-50 border-yellow-500 text-yellow-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-yellow-300'}`}>
                                    <span className="font-black">Modéré</span>
                                </button>
                                <button type="button" onClick={() => setGravity('rouge')} className={`cursor-pointer flex-1 py-3 flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${gravity === 'rouge' ? 'bg-red-50 border-red-500 text-red-700 shadow-md scale-105' : 'bg-white border-slate-200 text-slate-400 hover:border-red-300'}`}>
                                    <span className="font-black tracking-wide uppercase">Urgent</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* COLONNE DROITE */}
                    <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-slate-100 pt-8 lg:pt-0 lg:pl-12 flex flex-col space-y-8">

                        <div>
                            <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                                <Activity size={16} /> 1. Classification Syndromique
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {SYNDROMES.map(s => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setSyndrome(s.id)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${syndrome === s.id ? 'bg-keneya-green/10 border-keneya-green shadow-sm scale-105' : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'}`}
                                    >
                                        <s.icon size={28} strokeWidth={1.5} className={`${s.color} mb-2`} />
                                        <span className={`text-xs font-black ${syndrome === s.id ? 'text-keneya-navy' : 'text-slate-600'}`}>{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                                <Stethoscope size={16} /> 2. Statut Épidémiologique
                            </label>
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full">
                                <button type="button" onClick={() => setCaseStatus('suspect')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${caseStatus === 'suspect' ? 'bg-white text-orange-600 shadow-sm border border-orange-200' : 'text-slate-500 hover:text-slate-700'}`}>Cas Suspect</button>
                                <button type="button" onClick={() => setCaseStatus('probable')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${caseStatus === 'probable' ? 'bg-white text-yellow-600 shadow-sm border border-yellow-200' : 'text-slate-500 hover:text-slate-700'}`}>Cas Probable</button>
                                <button type="button" onClick={() => setCaseStatus('confirmed')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${caseStatus === 'confirmed' ? 'bg-white text-red-600 shadow-sm border border-red-200' : 'text-slate-500 hover:text-slate-700'}`}>Cas Confirmé</button>
                            </div>
                        </div>

                        <div className="flex-1">
                            <label className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                                <span className="flex items-center gap-2"><TestTube size={16} /> 3. Actions & Tests Rapides</span>
                                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Optionnel</span>
                            </label>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input type="checkbox" checked={actions.includes('tdr_palu')} onChange={() => toggleAction('tdr_palu')} className="w-5 h-5 text-keneya-navy rounded border-slate-300 focus:ring-keneya-navy" />
                                    <span className="text-sm font-bold text-slate-700">TDR Paludisme Négatif (Déclenche Alerte INHP)</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input type="checkbox" checked={actions.includes('lab_sample')} onChange={() => toggleAction('lab_sample')} className="w-5 h-5 text-keneya-navy rounded border-slate-300 focus:ring-keneya-navy" />
                                    <span className="text-sm font-bold text-slate-700">Prélèvement de laboratoire effectué</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 border border-red-200 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors rounded-xl">
                                    <input type="checkbox" checked={actions.includes('isolation')} onChange={() => toggleAction('isolation')} className="w-5 h-5 text-red-600 rounded border-red-300 focus:ring-red-500" />
                                    <span className="text-sm font-bold text-red-700">Patient placé en isolement strict</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="col-span-1 lg:col-span-12 mt-4 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col gap-1 order-2 sm:order-1">
                            <span className="text-sm font-bold text-slate-400">Données transmises en temps réel au radar SIG.</span>
                            {status === 'error' && (
                                <span className="text-xs font-black text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} /> {errorMessage}
                                </span>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={status === 'saving'}
                            className={`w-full sm:w-auto px-12 py-5 text-white text-xl font-black rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 order-1 sm:order-2
                                ${status === 'saved' ? 'bg-keneya-green' : 'bg-keneya-navy hover:bg-keneya-navy-light shadow-keneya-navy/20'}
                                ${status === 'error' ? 'bg-red-500' : ''}
                            `}
                        >
                            {status === 'saving' && <><Loader2 size={24} className="animate-spin" /> Transmission...</>}
                            {status === 'saved' && <><CheckCircle2 size={24} /> Cas Enregistré !</>}
                            {status === 'error' && <><AlertCircle size={24} /> Erreur</>}
                            {status === 'idle' && <><Save size={24} /> Transmettre le Cas</>}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
