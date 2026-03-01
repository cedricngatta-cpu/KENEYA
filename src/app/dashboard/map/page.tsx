'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { Map, Filter, Activity, MapPin, AlertTriangle, Layers, Radio, Search, ActivitySquare, ShieldAlert, Users } from 'lucide-react';

const ORSMap = dynamic(() => import('@/components/dashboard/ORSMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-900 animate-pulse flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-sm">Initialisation Cartographie...</div>
});

const HOSPITAL_CENTERS = [
    { id: 1, name: 'CHU de Treichville (Sud)', lat: 5.301, lng: -4.004 },
    { id: 2, name: 'CHU de Yopougon (Ouest)', lat: 5.340, lng: -4.068 },
    { id: 3, name: 'CHU de Cocody (Est)', lat: 5.348, lng: -3.988 },
    { id: 4, name: 'Hôpital Général Abobo (Nord)', lat: 5.421, lng: -4.015 }
];

const ZONE_COORDS: Record<string, [number, number]> = {
    'Abobo': [5.416, -4.016], 'Adjamé': [5.361, -4.020], 'Anyama': [5.494, -4.053],
    'Attécoubé': [5.337, -4.038], 'Bingerville': [5.356, -3.885], 'Cocody': [5.348, -3.988],
    'Koumassi': [5.297, -3.945], 'Marcory': [5.305, -3.974], 'Plateau': [5.326, -4.019],
    'Port-Bouët': [5.253, -3.931], 'Songon': [5.318, -4.269], 'Treichville': [5.301, -4.004],
    'Yopougon': [5.340, -4.068]
};

// Fonction pour ajouter un léger bruit aléatoire pour éviter que les points ne se superposent
const getJitteredCoords = (zone: string | null): [number, number] => {
    const base = zone && ZONE_COORDS[zone] ? ZONE_COORDS[zone] : [5.340, -4.000]; // Abidjan center default
    const jitterLat = (Math.random() - 0.5) * 0.04; // ~4km radius
    const jitterLng = (Math.random() - 0.5) * 0.04;
    return [base[0] + jitterLat, base[1] + jitterLng];
};

const mapSyndromeToFilter = (syndromeList: string[]): string => {
    const s = syndromeList[0]?.toLowerCase() || '';
    if (s.includes('diarrh') || s.includes('chol')) return 'diarrhee';
    if (s.includes('respiratoire') || s.includes('toux')) return 'respi';
    if (s.includes('hémorragique') || s.includes('rouge')) return 'rouge';
    if (s.includes('fièvre') || s.includes('fébrile')) return 'fievre';
    return 'all';
};

export default function SigMapDashboard() {
    const supabase = createClient();
    const [filter, setFilter] = useState('all');
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);
    const [liveCases, setLiveCases] = useState<any[]>([]);
    const [liveFeed, setLiveFeed] = useState<any[]>([]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setShowLeftPanel(false);
                setShowRightPanel(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetchReports();
        const interval = setInterval(fetchReports, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, []);

    async function fetchReports() {
        const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(200);
        if (data) {
            const mappedCases = data.map((r: any) => {
                let lat, lng;
                if (r.metadata && r.metadata.lat && r.metadata.lng) {
                    lat = parseFloat(r.metadata.lat);
                    lng = parseFloat(r.metadata.lng);
                } else {
                    [lat, lng] = getJitteredCoords(r.geo_cell);
                }
                const mappedSyndrome = mapSyndromeToFilter(r.symptoms || []);
                return {
                    id: r.id,
                    lat,
                    lng,
                    syndrome: mappedSyndrome,
                    triage: r.severity === 'rouge' ? 'Urgent' : r.severity === 'jaune' ? 'Modéré' : 'Faible',
                    patient: 'Patient SIG', // Anonymisé
                    description: `Symptômes reportés : ${(r.symptoms || []).join(', ')}`,
                    created_at: r.created_at,
                    zone: r.geo_cell || 'Inconnu'
                };
            });
            setLiveCases(mappedCases);

            // Générer le feed à partir des 30 derniers
            setLiveFeed(mappedCases.slice(0, 30));
        }
    }

    const filteredCases = filter === 'all'
        ? liveCases
        : liveCases.filter(c => c.syndrome === filter);

    const formatTime = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `Il y a ${mins} min`;
        return `Il y a ${Math.floor(mins / 60)}h`;
    };

    return (
        <div className="h-screen flex bg-slate-950 text-white overflow-hidden relative font-sans no-scrollbar">

            {/* CARTE GEOGRAPHIQUE REELLE (ORS + Leaflet) */}
            <div className="absolute inset-0 z-0">
                <ORSMap centers={HOSPITAL_CENTERS} cases={filteredCases as any} />
            </div>

            {/* SUPERPOSITION RADAR (Effets HUD conservés) */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.4)_100%)]"></div>

                {/* Effet Scanner Radar - Ajusté pour Mobile */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[800px] border border-keneya-green/20 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[800px] rounded-full bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(70,131,62,0.1)_360deg)] animate-spin" style={{ animationDuration: '6s' }}></div>
            </div>

            {/* CONTRÔLES D'AFFICHAGE FLOTTANTS - Toujours visibles sur mobile si panneaux fermés */}
            <div className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-50 flex gap-4">
                {!showLeftPanel && (
                    <button onClick={() => setShowLeftPanel(true)} className="p-3 md:p-4 bg-slate-900/80 backdrop-blur border border-white/10 rounded-2xl shadow-2xl hover:bg-keneya-navy transition-all animate-in slide-in-from-bottom-5 pointer-events-auto">
                        <Filter className="text-keneya-green md:w-6 md:h-6" size={20} />
                    </button>
                )}
                {!showRightPanel && (
                    <button onClick={() => setShowRightPanel(true)} className="p-3 md:p-4 bg-slate-900/80 backdrop-blur border border-white/10 rounded-2xl shadow-2xl hover:bg-keneya-navy transition-all animate-in slide-in-from-bottom-5 pointer-events-auto">
                        <ActivitySquare className="text-keneya-red md:w-6 md:h-6" size={20} />
                    </button>
                )}
            </div>

            {/* PANNEAU LATÉRAL GAUCHE (Contrôles & Couches) */}
            <div className={`absolute top-4 md:top-6 left-4 md:left-6 bottom-4 md:bottom-6 w-[calc(100%-2rem)] md:w-80 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col z-20 shadow-2xl overflow-hidden no-scrollbar transition-all duration-500 ${showLeftPanel ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0'}`}>
                <div className="p-4 md:p-6 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-base md:text-xl font-black text-white flex items-center gap-2 tracking-tight">
                            <Radio className="text-keneya-green animate-pulse w-5 h-5 md:w-6 md:h-6" /> Radar SIG
                        </h2>
                        <p className="text-slate-400 text-[8px] md:text-xs font-medium mt-1 uppercase tracking-widest opacity-70">Abidjan Surveillance</p>
                    </div>
                    <button onClick={() => setShowLeftPanel(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-500">
                        <Filter size={18} />
                    </button>
                </div>

                <div className="p-4 md:p-6 flex-1 overflow-y-auto space-y-6 md:space-y-8 no-scrollbar">
                    {/* Recherche */}
                    <div className="relative">
                        <input type="text" placeholder="Rechercher..." className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 md:py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-keneya-green transition-colors" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    </div>

                    {/* Échelle Temps */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={14} /> Fenêtre Active</h3>
                        <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                            <button className="flex-1 py-1.5 text-xs font-bold bg-slate-700 text-white rounded-lg shadow-sm">24H</button>
                            <button className="flex-1 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors">72H</button>
                            <button className="flex-1 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors">7J</button>
                        </div>
                    </div>

                    {/* Couches Syndromiques */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Layers size={14} /> Cartographie</h3>
                        <div className="space-y-2">
                            {[
                                { id: 'all', label: 'Tous les signalements', count: liveCases.length, color: 'bg-slate-400' },
                                { id: 'fievre', label: 'Syndrome Fébril', count: liveCases.filter(c => c.syndrome === 'fievre').length, color: 'bg-orange-500' },
                                { id: 'respi', label: 'Respiratoire', count: liveCases.filter(c => c.syndrome === 'respi').length, color: 'bg-teal-400' },
                                { id: 'diarrhee', label: 'Digestif & Cholérique', count: liveCases.filter(c => c.syndrome === 'diarrhee').length, color: 'bg-blue-500' },
                                { id: 'rouge', label: 'Hémorragique (Urgence)', count: liveCases.filter(c => c.triage === 'Urgent').length, color: 'bg-keneya-red' },
                            ].map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setFilter(s.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${filter === s.id ? 'bg-keneya-green/20 border-keneya-green/50 text-white' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-black/40 hover:text-white'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-3 h-3 rounded-full ${s.color} shadow-[0_0_8px_currentColor]`}></span>
                                        <span className="font-bold text-sm">{s.label}</span>
                                    </div>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${filter === s.id ? 'bg-keneya-green/30 text-keneya-green-light' : 'bg-black/50 text-slate-500'}`}>{s.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* PANNEAU LATÉRAL DROIT (Live Feed & HUD) */}
            <div className={`absolute top-4 md:top-6 right-4 md:right-6 bottom-4 md:bottom-6 w-[calc(100%-2rem)] md:w-80 flex flex-col gap-4 md:gap-6 z-20 transition-all duration-500 ${showRightPanel ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}`}>
                {/* HUD Info Box */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-4 md:p-5 rounded-3xl shadow-2xl relative">
                    <button onClick={() => setShowRightPanel(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-500">
                        <ActivitySquare size={18} />
                    </button>
                    <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2"><ShieldAlert size={14} /> Statut IA KENEYA</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] md:text-xs font-bold text-slate-300">Moteur Détection</span>
                            <span className="flex items-center gap-1 text-[8px] md:text-[10px] font-black text-keneya-green uppercase bg-keneya-green/10 border border-keneya-green/20 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 bg-keneya-green rounded-full animate-pulse"></span> OK</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] md:text-xs font-bold text-slate-300">Alerte</span>
                            <span className="text-[8px] md:text-[10px] font-black text-white uppercase bg-keneya-red border border-keneya-red px-2 py-0.5 rounded-full shadow-lg">VIGILANCE</span>
                        </div>
                    </div>
                </div>

                {/* Live Feed */}
                <div className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-5 shadow-2xl flex flex-col overflow-hidden">
                    <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2">
                        Flux direct <span className="w-2 h-2 rounded-full bg-keneya-red animate-pulse"></span>
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar text-sm">
                        {liveFeed.length > 0 ? liveFeed.map((event, i) => (
                            <div key={i} className="bg-black/40 border border-white/5 p-3 rounded-2xl flex gap-3 text-sm transition-all hover:bg-white/5 cursor-pointer">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${event.triage === 'Urgent' ? 'bg-keneya-red/20 text-keneya-red' :
                                    event.triage === 'Modéré' ? 'bg-orange-500/20 text-orange-500' :
                                        'bg-slate-700/50 text-slate-400'
                                    }`}>
                                    {event.triage === 'Urgent' ? <AlertTriangle size={14} /> : event.triage === 'Modéré' ? <ActivitySquare size={14} /> : <Activity size={14} />}
                                </div>
                                <div>
                                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                        <span className="font-bold text-white text-xs">{event.zone}</span>
                                        <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">{formatTime(event.created_at)}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-snug">{event.description}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-slate-500 text-xs text-center p-4">Aucun évènement en direct.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
