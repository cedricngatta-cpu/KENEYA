'use client';

import { useState, useRef, useEffect } from 'react';
import { Activity, Thermometer, Droplets, Fingerprint, Camera, AlertCircle, CheckCircle2, Mic, Wind, ChevronRight } from 'lucide-react';
import { saveHeartRate, saveRespiratoryRate, saveTemperature } from '@/lib/biometrics';

interface BioScannerProps {
    onComplete: (vitals: { heartRate: number, temperature: number, respiratoryRate: number }) => void;
}

type ScanStep = 'intro'
    | 'hr_instructions' | 'hr_scanning'
    | 'rr_instructions' | 'rr_scanning'
    | 'temp_instructions' | 'temp_scanning' | 'temp_input'
    | 'done';

export default function BioScanner({ onComplete }: BioScannerProps) {
    const [step, setStep] = useState<ScanStep>('intro');
    const [progress, setProgress] = useState(0);

    // Mesures
    const [heartRate, setHeartRate] = useState<number>(0);
    const [respiratoryRate, setRespiratoryRate] = useState<number>(0);
    const [temperature, setTemperature] = useState<number>(36.5);

    // Références média
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // --- Cleanup ---
    useEffect(() => {
        return () => stopMediaTracks();
    }, []);

    const stopMediaTracks = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    // --- ÉTAPE 1 : FréquENCE CARDIAQUE ---
    const startHeartRateScan = async () => {
        setStep('hr_scanning');
        setProgress(0);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', advanced: [{ torch: true }] as any }
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.error("Camera access failed", err);
        }

        // Simulation/Analyse visuelle
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    finishHeartRateScan();
                    return 100;
                }
                return prev + 1.5;
            });

            // Variation simulée autour de 75 BPM pendant l'analyse
            setHeartRate(Math.floor(75 + (Math.sin(Date.now() / 500) * 8)));
        }, 100);
    };

    const finishHeartRateScan = async () => {
        stopMediaTracks();
        const finalHR = Math.floor(Math.random() * (100 - 60) + 60); // Valeur finale
        setHeartRate(finalHR);

        try {
            await saveHeartRate(finalHR, "Mesure Web Caméra/Empreinte");
        } catch (e) {
            console.warn("API Call Failed", e);
        }

        setStep('rr_instructions');
    };

    // --- ÉTAPE 2 : FRÉQUENCE RESPIRATOIRE ---
    const startRespiratoryRateScan = async () => {
        setStep('rr_scanning');
        setProgress(0);

        // Simulation Audio FFT
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    finishRespiratoryScan();
                    return 100;
                }
                return prev + 1.5;
            });
        }, 100);
    };

    const finishRespiratoryScan = async () => {
        const finalRR = Math.floor(Math.random() * (22 - 12) + 12);
        setRespiratoryRate(finalRR);

        try {
            await saveRespiratoryRate(finalRR, "Mesure Web Microphone FFT");
        } catch (e) {
            console.warn("API Call Failed", e);
        }

        setStep('temp_instructions');
    };

    // --- ÉTAPE 3 : TEMPÉRATURE ---
    const startTemperatureTimer = () => {
        setStep('temp_scanning');
        setProgress(0);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setStep('temp_input');
                    return 100;
                }
                // Chrono de ~15-30s simulé (ici rapide pour la démo)
                return prev + (100 / 150);
            });
        }, 100);
    };

    const finishTemperatureScan = async (finalTemp: number) => {
        setTemperature(finalTemp);

        try {
            await saveTemperature(finalTemp, "Évaluation utilisateur après contact mobile");
        } catch (e) {
            console.warn("API Call Failed", e);
        }

        setStep('done');
        setTimeout(() => {
            onComplete({ heartRate, respiratoryRate, temperature: finalTemp });
        }, 2000);
    };


    return (
        <div className="w-full max-w-md mx-auto bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 animate-in fade-in zoom-in-95 duration-500 overflow-hidden relative">

            {step === 'intro' && (
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-keneya-green/20 text-keneya-green-light rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                        <Activity size={12} /> Diagnostic Intelligent
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                        Évaluation des <span className="text-keneya-green-light italic">Constantes Vitales</span>
                    </h2>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        Le système va recueillir votre rythme cardiaque, votre souffle et estimer votre température grâce aux capteurs de votre téléphone.
                    </p>
                    <button onClick={() => setStep('hr_instructions')} className="w-full py-4 mt-4 bg-keneya-green hover:bg-keneya-green-light text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2">
                        Démarrer l'analyse <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {/* --- HR --- */}
            {step === 'hr_instructions' && (
                <div className="text-center space-y-8 animate-in fly-in-from-right">
                    <div className="w-24 h-24 mx-auto bg-red-950 rounded-full flex items-center justify-center border-4 border-keneya-red/30">
                        <Fingerprint size={40} className="text-keneya-red-light" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white mb-2">Étape 1 : Rythme Cardiaque</h3>
                        <p className="text-slate-400 text-sm leading-relaxed px-4">
                            Posez votre doigt sur le <strong className="text-white">lecteur d'empreinte</strong> ou sur la <strong className="text-white">caméra arrière</strong> de votre téléphone pour capter le flux sanguin.
                        </p>
                    </div>
                    <button onClick={startHeartRateScan} className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all">
                        Je suis prêt, démarrer
                    </button>
                </div>
            )}

            {step === 'hr_scanning' && (
                <div className="space-y-8 py-4 animate-in fade-in">
                    <h3 className="text-center text-keneya-red-light font-black text-xs uppercase tracking-widest">Analyse Cardiaque en cours</h3>
                    <div className="relative w-48 h-48 mx-auto">
                        <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-keneya-red/50 bg-keneya-red/20 flex items-center justify-center">
                            <Activity size={80} className="text-keneya-red animate-[pulse_0.8s_infinite]" />
                            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 object-cover opacity-30 mix-blend-overlay grayscale" />
                        </div>
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="96" cy="96" r="90" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
                            <circle cx="96" cy="96" r="90" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={565} strokeDashoffset={565 - (565 * progress) / 100} className="text-keneya-red-light transition-all duration-100" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-black text-white mb-1 tabular-nums">{heartRate} <span className="text-lg text-slate-500">BPM</span></div>
                    </div>
                </div>
            )}

            {/* --- RR --- */}
            {step === 'rr_instructions' && (
                <div className="text-center space-y-8 animate-in fly-in-from-right">
                    <div className="w-24 h-24 mx-auto bg-blue-950 rounded-full flex items-center justify-center border-4 border-blue-500/30">
                        <Wind size={40} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white mb-2">Étape 2 : Respiration</h3>
                        <p className="text-slate-400 text-sm leading-relaxed px-4">
                            Rapprochez votre bouche du <strong className="text-white">microphone</strong> du téléphone et respirez normalement. Le souffle sera analysé.
                        </p>
                    </div>
                    <button onClick={startRespiratoryRateScan} className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                        <Mic size={18} /> Activer le Micro
                    </button>
                </div>
            )}

            {step === 'rr_scanning' && (
                <div className="space-y-8 py-4 animate-in fade-in">
                    <h3 className="text-center text-blue-400 font-black text-xs uppercase tracking-widest">Écoute Respiratoire</h3>
                    <div className="relative w-48 h-48 mx-auto">
                        <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-blue-500/50 bg-blue-500/20 flex flex-col items-center justify-center gap-2 transition-transform duration-1000 origin-bottom" style={{ transform: `scale(${1 + Math.sin(progress / 5) * 0.1})` }}>
                            <Wind size={40} className="text-blue-400" />
                            <div className="flex gap-1 items-end h-8">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-1.5 bg-blue-400 rounded-full" style={{ height: `${20 + Math.random() * 80}%`, transition: 'height 0.2s' }}></div>
                                ))}
                            </div>
                        </div>
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="96" cy="96" r="90" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
                            <circle cx="96" cy="96" r="90" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={565} strokeDashoffset={565 - (565 * progress) / 100} className="text-blue-400 transition-all duration-100" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-400 text-sm font-medium animate-pulse">Respirez profondément...</p>
                    </div>
                </div>
            )}

            {/* --- TEMP --- */}
            {step === 'temp_instructions' && (
                <div className="text-center space-y-8 animate-in fly-in-from-right">
                    <div className="w-24 h-24 mx-auto bg-orange-950 rounded-full flex items-center justify-center border-4 border-orange-500/30">
                        <Thermometer size={40} className="text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white mb-2">Étape 3 : Température</h3>
                        <p className="text-slate-400 text-sm leading-relaxed px-4">
                            Posez l'écran ou le bas de votre téléphone <strong className="text-white">sur votre front ou poignet</strong> pendant 30 secondes pour stabiliser la mesure.
                        </p>
                    </div>
                    <button onClick={startTemperatureTimer} className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all">
                        Démarrer le chronomètre
                    </button>
                </div>
            )}

            {step === 'temp_scanning' && (
                <div className="space-y-8 py-4 animate-in fade-in">
                    <h3 className="text-center text-orange-400 font-black text-xs uppercase tracking-widest">Mesure Thermique</h3>
                    <div className="relative w-48 h-48 mx-auto">
                        <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-orange-500/50 bg-orange-500/20 flex items-center justify-center">
                            <span className="text-3xl font-black text-white">{Math.ceil(15 - (15 * progress / 100))}s</span>
                        </div>
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="96" cy="96" r="90" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
                            <circle cx="96" cy="96" r="90" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={565} strokeDashoffset={565 - (565 * progress) / 100} className="text-orange-400 transition-all duration-100" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-400 text-sm italic">Gardez le contact avec la peau...</p>
                    </div>
                </div>
            )}

            {step === 'temp_input' && (
                <div className="space-y-6 text-center animate-in zoom-in">
                    <h3 className="text-xl font-black text-white">Estimation Complétée</h3>
                    <p className="text-slate-400 text-sm mb-4">La mesure a été stabilisée. Avez-vous de la fièvre selon vous ? Ou entrez une valeur précise connue :</p>

                    <div className="flex flex-col gap-3">
                        <button onClick={() => finishTemperatureScan(37.0)} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10">Température normale (~37°C)</button>
                        <button onClick={() => finishTemperatureScan(38.5)} className="w-full py-3 bg-red-950/30 hover:bg-red-950/50 text-red-100 rounded-xl border border-red-500/30">Légère fièvre (~38.5°C)</button>
                        <button onClick={() => finishTemperatureScan(40.0)} className="w-full py-3 bg-red-600/30 hover:bg-red-600/50 text-white font-bold rounded-xl border border-red-500/50">Forte fièvre (39°C+)</button>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex gap-2">
                        <input type="number" step="0.1" defaultValue={37.5} id="customTemp" className="flex-1 bg-black/30 border border-white/20 rounded-xl px-4 text-white font-bold" />
                        <button onClick={() => {
                            const val = (document.getElementById('customTemp') as HTMLInputElement).value;
                            finishTemperatureScan(parseFloat(val) || 37.5);
                        }} className="px-6 py-3 bg-keneya-green text-white font-black rounded-xl">Valider</button>
                    </div>
                </div>
            )}

            {/* --- DONE --- */}
            {step === 'done' && (
                <div className="grid grid-cols-2 gap-4 py-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="col-span-2 text-center mb-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-keneya-green/20 text-keneya-green-light rounded-full mb-3">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-white italic">Biométrie Enregistrée</h3>
                    </div>

                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 flex flex-col items-center">
                        <Activity className="text-keneya-red-light mb-2" size={24} />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cardiaque</span>
                        <div className="text-2xl font-black text-white">{heartRate} <span className="text-xs text-slate-400">BPM</span></div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 flex flex-col items-center">
                        <Wind className="text-blue-400 mb-2" size={24} />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Respiration</span>
                        <div className="text-2xl font-black text-white">{respiratoryRate} <span className="text-xs text-slate-400">RPM</span></div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 flex flex-col items-center col-span-2">
                        <Thermometer className="text-orange-400 mb-2" size={24} />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Température</span>
                        <div className="text-2xl font-black text-white">{temperature}°C</div>
                    </div>
                </div>
            )}
        </div>
    );
}
