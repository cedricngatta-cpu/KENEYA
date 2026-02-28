'use client';

import { useState } from 'react';
import { Shield, ChevronLeft, Fingerprint, Activity, User, Phone, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import BioScanner from '@/components/dashboard/BioScanner';
import { createClient } from '@/lib/supabase/client';

export default function TriagePage() {
    const [step, setStep] = useState<'intro' | 'contact_form' | 'scanning' | 'success'>('intro');
    const [patientInfo, setPatientInfo] = useState({ name: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [vitalsData, setVitalsData] = useState<{ heartRate: number, temperature: number, respiratoryRate: number } | null>(null);

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (patientInfo.phone.trim() !== '') {
            setStep('scanning');
        }
    };

    const handleScanComplete = async (vitals: { heartRate: number, temperature: number, respiratoryRate: number }) => {
        setVitalsData(vitals);
        setIsSubmitting(true);
        setStep('success'); // On passe d'abord à success visuellement pour ne pas bloquer

        try {
            const supabase = createClient();

            // Estimation basique de symptôme pour la BDD depuis les constantes
            let severity = 'vert';
            let symptoms = ['Triage Rapide'];
            if (vitals.temperature > 38.5 || vitals.heartRate > 100 || vitals.respiratoryRate > 25) {
                severity = 'rouge';
                symptoms.push('Constantes Anormales');
            } else if (vitals.temperature > 37.8 || vitals.heartRate > 90) {
                severity = 'jaune';
            }

            await supabase.from('reports').insert({
                patient_name: patientInfo.name || 'Anonyme',
                patient_phone: patientInfo.phone,
                symptoms: symptoms,
                symptoms_text: `Triage par capteurs. FC: ${vitals.heartRate} bpm | Resp: ${vitals.respiratoryRate} rpm | Temp: ${vitals.temperature}°C`,
                severity: severity,
                metadata: { vitals: vitals, source: 'triage_empreinte' },
                geo_cell: 'Abidjan-Triage'
            });
        } catch (error) {
            console.error("Erreur lors de l'enregistrement du rapport de triage:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-keneya-navy relative flex flex-col font-sans overflow-hidden">
            {/* Background */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[100px] bg-keneya-green/10" />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 p-4 sm:p-6 z-50 flex items-center justify-between">
                {step !== 'success' && (
                    <button onClick={() => window.history.back()} className="w-12 h-12 flex items-center justify-center bg-white/10 border border-white/20 backdrop-blur-md rounded-full shadow-lg active:scale-95 transition-transform text-white">
                        <ChevronLeft size={28} />
                    </button>
                )}
                <div className="ml-auto w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/20 shadow-xl backdrop-blur-md">
                    <Shield size={24} className="text-keneya-green-light" />
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full relative z-10 max-w-lg mx-auto mt-16 text-center">

                {/* 1. INTRO */}
                {step === 'intro' && (
                    <div className="w-full animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 mx-auto text-white bg-keneya-green/20 border-4 border-keneya-green rounded-full flex items-center justify-center mb-6 shadow-xl">
                            <Fingerprint size={48} className="text-keneya-green-light animate-pulse" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-3 leading-tight tracking-tight">Triage par<br />Empreinte Biométrique</h1>
                        <p className="text-base text-slate-400 font-medium mb-10 px-4">
                            Ce processus utilise les capteurs de votre téléphone pour évaluer rapidement vos constantes vitales sans parler.
                        </p>

                        <button onClick={() => setStep('contact_form')} className="px-6 py-4 w-full flex items-center justify-center gap-3 bg-keneya-green text-white text-lg font-black rounded-2xl shadow-[0_0_30px_rgba(70,131,62,0.4)] hover:bg-keneya-green-light transition-all active:scale-95">
                            <Activity size={24} /> Évaluer mes constantes
                        </button>
                    </div>
                )}

                {/* 2. CONTACT FORM */}
                {step === 'contact_form' && (
                    <div className="w-full animate-in slide-in-from-right duration-500">
                        <h2 className="text-2xl font-black text-white mb-2">Identification</h2>
                        <p className="text-slate-400 text-sm mb-8">Veuillez entrer au moins votre numéro de téléphone pour lier ces constantes à votre dossier clinique.</p>

                        <form onSubmit={handleContactSubmit} className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Votre nom (optionnel)"
                                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-keneya-green-light transition-colors"
                                    value={patientInfo.name}
                                    onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                                />
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="tel"
                                    required
                                    placeholder="Numéro de téléphone *"
                                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-keneya-green-light transition-colors"
                                    value={patientInfo.phone}
                                    onChange={(e) => setPatientInfo({ ...patientInfo, phone: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full py-4 mt-4 bg-white text-keneya-navy rounded-2xl font-black text-lg transition-all active:scale-95 shadow-xl">
                                Suivant
                            </button>
                        </form>
                    </div>
                )}

                {/* 3. SCANNING (BioScanner) */}
                {step === 'scanning' && (
                    <div className="w-full animate-in zoom-in-95 duration-500">
                        <BioScanner onComplete={handleScanComplete} />
                    </div>
                )}

                {/* 4. SUCCESS */}
                {step === 'success' && (
                    <div className="w-full animate-in zoom-in-95 duration-500 flex flex-col items-center">
                        <div className="w-24 h-24 text-white rounded-full flex items-center justify-center mb-6 bg-keneya-green shadow-[0_0_40px_rgba(70,131,62,0.4)]">
                            <CheckCircle2 size={48} strokeWidth={3} />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-3 text-center">Triage Terminé</h1>
                        <p className="text-base text-slate-400 font-medium mb-10 px-4">
                            Vos constantes vitales ont été enregistrées en toute sécurité dans la base de données gouvernementale. Un agent de santé vous contactera si nécessaire.
                        </p>

                        <Link href="/" className="px-6 py-4 w-full bg-white/10 border border-white/20 text-white text-lg font-black rounded-2xl hover:bg-white/20 transition-all active:scale-95 inline-block">
                            Retour à l'accueil
                        </Link>
                    </div>
                )}

            </main>
        </div>
    );
}
