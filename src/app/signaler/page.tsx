'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Shield, ChevronLeft, Mic, MicOff, Check, Volume2 } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { createClient } from '@/lib/supabase/client';

export default function SignalerFlow() {
    const { t, setUserLanguage } = useLanguage();

    // Le flow démarre directement à 'greeting_vocal' (L'IA parle pour demander l'ethnie)
    // Le flow suit le protocole strict demandé
    // Nouveaux états pour le flow conversationnel détaillé
    const [step, setStep] = useState<
        'intro' | 'greeting_vocal' | 'listening_lang' |
        'ask_fever' | 'listen_fever' |
        'ask_digestive' | 'listen_digestive' |
        'ask_rash' | 'listen_rash' |
        'ask_other' | 'listen_other' |
        'processing' |
        'ask_details' | 'listen_details' |
        'result_vocal' | 'success'
    >('intro');

    // On stocke les symptômes détectés au fur et à mesure
    const [detectedSymptoms, setDetectedSymptoms] = useState<string[]>([]);
    const [patientName, setPatientName] = useState('');
    const [patientPhone, setPatientPhone] = useState('');

    const [transcript, setTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [diagnosis, setDiagnosis] = useState<'safe' | 'warning' | 'danger'>('safe');
    const [suspectedIllness, setSuspectedIllness] = useState('');
    const [instructions, setInstructions] = useState<string[]>([]);
    const [officialMatch, setOfficialMatch] = useState<any>(null);
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef('');

    // S'assurer que le TTS s'arrête si l'utilisateur quitte la page
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    // ==========================================
    // TTS (Text To Speech)
    // ==========================================
    const speakText = async (text: string, nextStep: any) => {
        // Bloquer toute écoute du microphone pendant que l'IA parle
        stopListening();
        window.speechSynthesis.cancel();

        // Timeout de secours au cas où l'API vocal plante silencieusement 
        // (150ms / caractère garantit que le timeout ne coupe pas une phrase)
        const maxDuration = Math.max(8000, text.length * 150);
        let safetyTimeout: any;

        const advance = () => {
            clearTimeout(safetyTimeout);
            if (nextStep === 'end') setStep('success');
            else setStep(nextStep);
        };

        safetyTimeout = setTimeout(advance, maxDuration);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 1.0; // vitesse normale

        // Référence globale pour éviter le nettoyage mémoire agressif des navigateurs
        (window as any).currentUtterance = utterance;

        utterance.onend = advance;
        utterance.onerror = advance;

        // On lance la voix !
        window.speechSynthesis.speak(utterance);
    };

    // ==========================================
    // STT (Speech To Text)
    // ==========================================
    const startListening = useCallback((target: string) => {
        // SÉCURITÉ : On s'assure que l'IA se tait complètement avant d'activer le micro de l'utilisateur
        window.speechSynthesis.cancel();
        if ((window as any).currentAudio) {
            try { (window as any).currentAudio.pause(); } catch (e) { }
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => { setIsRecording(true); setTranscript(''); transcriptRef.current = ''; };
        recognition.onresult = (e: any) => {
            let current = '';
            for (let i = 0; i < e.results.length; i++) current += e.results[i][0].transcript;
            const liveText = current.toLowerCase();
            setTranscript(current);
            transcriptRef.current = current;

            // Détection automatique de la langue
            if (target === 'lang') {
                const langFound = ['1', 'français', '2', 'dioula', '3', 'baoulé', '4', 'bété', '5', 'sénoufo'].some(l => liveText.includes(l));
                if (langFound) setTimeout(() => stopListening(), 1000);
            }
            // Détection Oui/Non
            else if (target.startsWith('listen_') && target !== 'listen_other' && target !== 'listen_details') {
                if (liveText.includes('oui') || liveText.includes('non') || liveText.includes('ouais') || liveText.includes('nan')) {
                    stopListening(); // Instantané
                }
            }
            // Détection de pause pour les questions ouvertes
            else if (target === 'listen_other' || target === 'listen_details') {
                if (liveText.length > 5) {
                    if ((window as any).silenceTimer) clearTimeout((window as any).silenceTimer);
                    (window as any).silenceTimer = setTimeout(() => stopListening(), 1200); // 1.2s de pause suffit
                }
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
            const finalTranscript = transcriptRef.current.trim().toLowerCase();

            if (target === 'lang') {
                if (finalTranscript.includes('1') || finalTranscript.includes('français')) setUserLanguage('fr');
                else if (finalTranscript.includes('2') || finalTranscript.includes('dioula')) setUserLanguage('dioula');
                else if (finalTranscript.includes('3') || finalTranscript.includes('baoulé')) setUserLanguage('baoule');
                else if (finalTranscript.includes('4') || finalTranscript.includes('bété')) setUserLanguage('bete');
                else if (finalTranscript.includes('5') || finalTranscript.includes('sénoufo')) setUserLanguage('senoufo');
                setStep('ask_fever');
            }
            else if (target === 'listen_fever') {
                if (finalTranscript.includes('oui') || finalTranscript.includes('ouais')) {
                    setDetectedSymptoms(prev => [...prev, 'fievre']);
                }
                setStep('ask_digestive');
            }
            else if (target === 'listen_digestive') {
                if (finalTranscript.includes('oui') || finalTranscript.includes('ouais') || finalTranscript.includes('vomiss') || finalTranscript.includes('diarrh')) {
                    setDetectedSymptoms(prev => [...prev, 'digestif']);
                }
                setStep('ask_rash');
            }
            else if (target === 'listen_rash') {
                if (finalTranscript.includes('oui') || finalTranscript.includes('ouais') || finalTranscript.includes('bouton') || finalTranscript.includes('plaqu')) {
                    setDetectedSymptoms(prev => [...prev, 'eruptif']);
                }
                setStep('ask_other');
            }
            else if (target === 'listen_other') {
                let finalSymptoms = [...detectedSymptoms];
                if (!finalTranscript.includes('non') && finalTranscript.length > 3) {
                    finalSymptoms.push(finalTranscript); // On ajoute le texte brut pour l'IA
                    setDetectedSymptoms(finalSymptoms);
                }

                // On passe à l'analyse
                setStep('processing');
                fetch('/api/triage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transcript: finalSymptoms.join(', ') })
                })
                    .then(res => res.json())
                    .then(data => {
                        setDiagnosis(data.diagnosis);
                        setSuspectedIllness(data.suspectedIllness);
                        setInstructions(data.instructions);
                        setOfficialMatch(data.officialAlertMatch);

                        if (data.diagnosis === 'danger' || data.diagnosis === 'warning') {
                            setStep('ask_details');
                        } else {
                            // Enregistrement direct si pas de danger sans demander les infos
                            const supabase = createClient();
                            supabase.from('reports').insert({
                                symptoms: finalSymptoms,
                                symptoms_text: finalSymptoms.join(', '),
                                patient_name: 'Anonyme',
                                patient_phone: '',
                                severity: 'vert',
                                suspected_illness: data.suspectedIllness,
                                geo_cell: 'Abidjan-Abobo'
                            }).then();
                            setStep('result_vocal');
                        }
                    });
            }
            else if (target === 'listen_details') {
                const finalTranscript = transcriptRef.current.trim();

                // Tentative d'extraction simplifiée (Nom et Téléphone)
                // Ex: "Jean Dupont 0102030405"
                const phoneMatch = finalTranscript.match(/(?:(?:\+|00)225)?\s?(\d[\s\d]{7,10})/);
                const phone = phoneMatch ? phoneMatch[0].replace(/\s/g, '') : '';
                const name = finalTranscript.replace(phoneMatch ? phoneMatch[0] : '', '').trim();

                setPatientName(name);
                setPatientPhone(phone);

                // Sauvegarde finale dans Supabase
                const supabase = createClient();
                const saveReport = async () => {
                    await supabase.from('reports').insert({
                        symptoms: detectedSymptoms,
                        symptoms_text: detectedSymptoms.join(', '),
                        patient_name: name || 'Anonyme',
                        patient_phone: phone || finalTranscript,
                        severity: diagnosis === 'danger' ? 'rouge' : (diagnosis === 'warning' ? 'jaune' : 'vert'),
                        suspected_illness: suspectedIllness,
                        geo_cell: 'Abidjan-Abobo' // Localisation par défaut pour le test
                    });
                };
                saveReport();

                setStep('result_vocal');
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [detectedSymptoms]);

    const stopListening = () => { if (recognitionRef.current) recognitionRef.current.stop(); setIsRecording(false); };

    // ==========================================
    // CYCLE DE VIE VOCAL
    // ==========================================
    useEffect(() => {
        if (step === 'greeting_vocal') {
            speakText("Bonjour. Choississez votre langue. Si c'est Français dites 1. Si c'est Dioula dites 2. Si c'est Baoulé dites 3.", 'listening_lang');
        } else if (step === 'listening_lang') {
            startListening('lang');
        }
        else if (step === 'ask_fever') {
            speakText("Avez-vous une forte fièvre ? Répondez par Oui ou par Non.", 'listen_fever');
        } else if (step === 'listen_fever') {
            startListening('listen_fever');
        }
        else if (step === 'ask_digestive') {
            speakText("Avez-vous de la diarrhée ou des vomissements ? Répondez par Oui ou par Non.", 'listen_digestive');
        } else if (step === 'listen_digestive') {
            startListening('listen_digestive');
        }
        else if (step === 'ask_rash') {
            speakText("Avez-vous des boutons ou des plaques sur le corps ? Répondez par Oui ou par Non.", 'listen_rash');
        } else if (step === 'listen_rash') {
            startListening('listen_rash');
        }
        else if (step === 'ask_other') {
            speakText("Avez-vous d'autres symptômes particuliers ? Si oui, dites lesquels, sinon dites Non.", 'listen_other');
        } else if (step === 'listen_other') {
            startListening('listen_other');
        }
        else if (step === 'ask_details') {
            speakText("Votre cas semble nécessiter un suivi. Veuillez me dire votre nom et votre numéro de téléphone pour les secours.", 'listen_details');
        } else if (step === 'listen_details') {
            startListening('listen_details');
        } else if (step === 'result_vocal') {
            const msg = diagnosis === 'danger'
                ? `Attention, suspicion de ${suspectedIllness}. Rendez-vous immédiatement aux urgences. ${instructions.join(' ')}`
                : `D'après vos symptômes, il s'agit probablement de ${suspectedIllness}. ${instructions.join(' ')}`;
            speakText(msg, 'end');
        }
    }, [step, diagnosis, suspectedIllness, instructions]);



    return (
        <div className="min-h-screen bg-keneya-navy relative flex flex-col font-sans overflow-hidden">
            {/* Background Animations for Voice Feedback */}
            <div className={`absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[100px] transition-colors duration-1000 
                ${isRecording ? 'bg-keneya-red/30 animate-pulse' : ''}
                ${step === 'result_vocal' && diagnosis === 'danger' ? 'bg-keneya-red/40 animate-pulse' : ''}
                ${step === 'result_vocal' && diagnosis === 'safe' ? 'bg-keneya-green/20' : ''}
                ${step === 'processing' ? 'bg-slate-500/30 animate-spin' : ''}
            `} />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 p-4 sm:p-6 z-50 flex items-center justify-between pointer-events-none">
                {step !== 'success' && (
                    <button onClick={() => { window.speechSynthesis.cancel(); window.history.back(); }} className="w-12 h-12 flex items-center justify-center bg-white/10 border border-white/20 backdrop-blur-md rounded-full shadow-lg pointer-events-auto active:scale-95 transition-transform text-white">
                        <ChevronLeft size={28} />
                    </button>
                )}
                <div className="ml-auto w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/20 shadow-xl pointer-events-auto backdrop-blur-md">
                    <Shield size={24} className={diagnosis === 'danger' ? "text-keneya-red-light" : "text-keneya-green-light"} />
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full relative z-10 max-w-lg mx-auto">

                {/* ETAPE: INTRO (Déblocage Audio) */}
                {step === 'intro' && (
                    <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 w-full text-center">
                        <div className="w-24 h-24 text-white bg-keneya-red rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(201,42,42,0.5)] animate-pulse">
                            <Volume2 size={48} strokeWidth={2} />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-3 text-center leading-tight tracking-tight">Déclarer un<br />Cas Suspect</h1>
                        <p className="text-base text-slate-400 font-medium max-w-sm mb-10">
                            L'Agent Vocal de Keneya va vous poser quelques questions pour comprendre la situation.
                        </p>

                        <button
                            onClick={() => {
                                // Petite initialisation vocale silencieuse pour "chauffer" le navigateur
                                const init = new SpeechSynthesisUtterance('');
                                window.speechSynthesis.speak(init);
                                setStep('greeting_vocal');
                            }}
                            className="px-6 py-4 w-full flex items-center justify-center gap-3 bg-white text-keneya-navy text-lg font-black rounded-2xl shadow-xl hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <Mic size={24} className="text-keneya-red" />
                            Démarrer l'Alerte
                        </button>
                    </div>
                )}

                {/* ETAPES VOCALES (IA PARLE) */}
                {(step === 'greeting_vocal' || step.startsWith('ask_') || step === 'result_vocal') && (
                    <div className="flex-1 flex flex-col items-center justify-center w-full animate-in zoom-in-95 duration-700">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 relative animate-bounce
                            ${diagnosis === 'danger' && step === 'result_vocal' ? 'bg-keneya-red shadow-[0_0_40px_rgba(201,42,42,0.5)]' : 'bg-keneya-green shadow-[0_0_40px_rgba(70,131,62,0.5)]'}
                        `} style={{ animationDuration: '3s' }}>
                            <div className={`absolute inset-0 border-4 rounded-full animate-ping ${diagnosis === 'danger' && step === 'result_vocal' ? 'border-keneya-red-light' : 'border-keneya-green-light'}`}></div>
                            <Volume2 size={48} className="text-white relative z-10 animate-pulse" />
                        </div>
                        <h1 className="text-2xl font-black text-white text-center leading-tight mb-2 uppercase tracking-tighter">
                            L'IA <span className={diagnosis === 'danger' && step === 'result_vocal' ? "text-keneya-red-light" : "text-keneya-green-light"}>vous parle</span>
                        </h1>
                        <p className="text-base text-slate-400 font-medium text-center italic">
                            Écoutez bien la question...
                        </p>
                    </div>
                )}


                {/* PROCESSING IA */}
                {step === 'processing' && (
                    <div className="flex-1 flex flex-col items-center justify-center w-full animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 border-8 border-slate-700 border-t-keneya-green rounded-full animate-spin mb-8"></div>
                        <h1 className="text-2xl font-black text-white text-center leading-tight mb-2">
                            Analyse <span className="text-keneya-green">Médicale...</span>
                        </h1>
                        <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">Moteur Claude 3.5 Sonnet actif</p>
                    </div>
                )}

                {/* ETAPES ECOUTE (USER PARLE) */}
                {(step.startsWith('list') || step.startsWith('listen_')) && (
                    <div className="flex-1 flex flex-col items-center justify-center w-full animate-in fade-in slide-in-from-bottom-12 duration-500">

                        <h1 className="text-2xl font-black text-white text-center mb-8 uppercase tracking-tight">
                            {step === 'listening_lang' ? "Choix de la langue" : step === 'listen_details' ? "Détails patient" : "Répondez (Oui / Non)"}
                        </h1>

                        <button
                            onClick={stopListening}
                            className="relative flex items-center justify-center w-40 h-40 rounded-full bg-keneya-red text-white shadow-[0_0_60px_rgba(201,42,42,0.4)] group active:scale-95 transition-transform"
                        >
                            <div className="absolute inset-0 border-[4px] border-white/20 rounded-full animate-ping"></div>
                            <Mic size={48} className="relative z-10 group-hover:scale-110 transition-transform" />
                            <div className="absolute bottom-6 font-black tracking-[0.2em] uppercase text-[9px] opacity-70">Appuyez pour finir</div>
                        </button>

                        <div className="mt-8 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 w-full text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-keneya-red to-transparent"></div>
                            <span className="text-keneya-red-light font-black text-[9px] uppercase tracking-[0.2em] block mb-3">Transcription en direct</span>
                            <p className="text-lg text-white font-bold leading-relaxed">
                                {transcript ? `"${transcript}"` : 'Attente de votre réponse...'}
                            </p>

                            {step.startsWith('listen_') && step !== 'listening_lang' && step !== 'listen_details' && (
                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                    <div className={`w-8 h-2 rounded-full transition-colors ${step !== 'listen_fever' ? 'bg-keneya-green' : 'bg-white/10'}`}></div>
                                    <div className={`w-8 h-2 rounded-full transition-colors ${step === 'listen_rash' || step === 'listen_other' ? 'bg-keneya-green' : 'bg-white/10'}`}></div>
                                    <div className={`w-8 h-2 rounded-full transition-colors ${step === 'listen_other' ? 'bg-keneya-green' : 'bg-white/10'}`}></div>
                                    <span className="ml-2 text-[9px] font-black text-slate-500 uppercase">Progression du questionnaire</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ETAPE: SUCCESS */}
                {step === 'success' && (
                    <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 w-full text-center">
                        <div className={`w-24 h-24 text-white rounded-full flex items-center justify-center mb-6 shadow-xl ${diagnosis === 'danger' ? 'bg-keneya-red shadow-keneya-red/40' : 'bg-keneya-green shadow-keneya-green/40'}`}>
                            <Check size={48} strokeWidth={4} />
                        </div>
                        {officialMatch && (
                            <div className="mb-6 p-3 bg-keneya-green/10 border border-keneya-green/30 rounded-xl animate-in zoom-in-95 duration-1000">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-keneya-green-light block mb-2">Vérification Gouvernementale</span>
                                <p className="text-white text-xs font-medium">
                                    Cas correspondant à l'alerte <span className="font-bold text-keneya-green-light underline decoration-dotted">{officialMatch.disease}</span> signalée par le {officialMatch.source}.
                                </p>
                            </div>
                        )}

                        <h1 className="text-3xl font-black text-white mb-3 text-center">Appel Terminé</h1>
                        <p className="text-base text-slate-400 font-medium max-w-sm mb-10">
                            Votre dossier médical vocal a été enregistré et traité par la Mairie d'Abidjan.
                        </p>

                        <Link href="/" onClick={() => window.speechSynthesis.cancel()} className="px-6 py-4 w-full text-center bg-white text-keneya-navy text-lg font-black rounded-2xl shadow-xl hover:bg-slate-100 transition-all active:scale-95">
                            Terminer
                        </Link>
                    </div>
                )}

            </main>
        </div>
    );
}
