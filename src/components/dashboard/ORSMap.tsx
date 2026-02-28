'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Initial position: Abidjan Center
const ABIDJAN_CENTER: [number, number] = [5.360, -4.008];

interface MapCase {
    id: string;
    lat: number;
    lng: number;
    syndrome: string;
    triage: 'Urgent' | 'Modéré' | 'Faible';
    patient: string;
    description: string;
}

interface ORSMapProps {
    centers?: Array<{ id: number, name: string, lat: number, lng: number }>;
    cases?: MapCase[];
}

const getMarkerIcon = (syndrome: string, triage: string) => {
    const color = triage === 'Urgent' ? '#EF4444' : triage === 'Modéré' ? '#F59E0B' : '#64748B';
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z"/>
            <circle cx="12" cy="9" r="3"/>
        </svg>
    `;
    return L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-pin animate-in zoom-in-50 duration-300" style="filter: drop-shadow(0 0 8px ${color});">${svg}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });
};

export default function ORSMap({ centers = [], cases = [] }: ORSMapProps) {
    const [isochrones, setIsochrones] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchIsochrone = async (lat: number, lng: number) => {
        const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
        if (!apiKey) {
            console.error("ORS API Key is missing");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('https://api.openrouteservice.org/v2/isochrones/driving-car', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': apiKey,
                },
                body: JSON.stringify({
                    locations: [[lng, lat]],
                    range: [900, 1800], // 15 min and 30 min (in seconds)
                    range_type: 'time',
                    area_units: 'km',
                    smoothing: 0.1
                })
            });

            if (!response.ok) throw new Error('Failed to fetch isochrone');
            const data = await response.json();
            setIsochrones(prev => [...prev, data]);
        } catch (error) {
            console.error("Error fetching ORS isochrone:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full relative no-scrollbar">
            <MapContainer
                center={ABIDJAN_CENTER}
                zoom={12}
                style={{ height: '100%', width: '100%', background: '#020617' }}
                zoomControl={false}
            >
                {/* Mode Sombre - CartoDB Dark Matter */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <ZoomControl position="bottomright" />

                {/* Markers for Centers */}
                {centers.map(center => (
                    <Marker key={center.id} position={[center.lat, center.lng]}>
                        <Popup>
                            <div className="p-1">
                                <p className="font-bold text-slate-900">{center.name}</p>
                                <button
                                    onClick={() => fetchIsochrone(center.lat, center.lng)}
                                    className="mt-2 text-[10px] bg-keneya-navy text-white px-2 py-1 rounded-md w-full font-bold hover:bg-keneya-green transition-colors"
                                >
                                    Calculer Zone de Couverture (ORS)
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Render Reported Cases */}
                {cases?.map(c => (
                    <Marker
                        key={c.id}
                        position={[c.lat, c.lng]}
                        icon={getMarkerIcon(c.syndrome, c.triage)}
                    >
                        <Popup>
                            <div className="p-2 min-w-[180px]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Signalement SIG</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${c.triage === 'Urgent' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {c.triage.toUpperCase()}
                                    </span>
                                </div>
                                <p className="font-black text-slate-900 text-sm mb-1">{c.patient}</p>
                                <p className="text-xs text-slate-500 font-medium italic mb-3 leading-tight">"{c.description}"</p>
                                <button className="w-full bg-keneya-navy text-white text-[10px] py-2 rounded-lg font-bold hover:bg-keneya-navy-light transition-all">Affecter Equipe Mobile</button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {loading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-keneya-navy/90 backdrop-blur px-4 py-2 rounded-full border border-white/10 shadow-2xl flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-keneya-green border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Analyse ORS en cours...</span>
                </div>
            )}
        </div>
    );
}
