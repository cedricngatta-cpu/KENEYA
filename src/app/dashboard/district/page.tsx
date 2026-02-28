'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Users, MapPin, Activity, ShieldAlert,
    TrendingUp, Calendar, Search, Filter,
    CheckCircle2, AlertTriangle, ArrowUpRight,
    Map as MapIcon, ChevronRight, LayoutDashboard, Clock
} from 'lucide-react';
import Link from 'next/link';

export default function DistrictDashboard() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeAlerts: 12,
        pendingReports: 45,
        onlineAgents: 8,
        resolvedToday: 5
    });

    useEffect(() => {
        // Simulation de chargement des données du district
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-10">
            {/* Header / Top Navigation */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 lg:ml-64">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-keneya-navy flex items-center gap-2">
                            <LayoutDashboard className="text-keneya-green" size={24} />
                            District Sanitaire d'Abobo
                        </h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Supervision & Direction</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 border border-slate-200">
                            <Users size={16} className="text-slate-500" />
                            <span className="text-xs font-black text-slate-700">{stats.onlineAgents} Agents en ligne</span>
                        </div>
                        <Link href="/dashboard/map" className="p-2 bg-keneya-green/10 text-keneya-green rounded-full hover:bg-keneya-green hover:text-white transition-all">
                            <MapIcon size={20} />
                        </Link>
                    </div>
                </div>
            </div>

            <main className="lg:ml-64 p-6 lg:p-8 space-y-8">

                {/* Stats Cards Integration */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Alertes Actives"
                        value={stats.activeAlerts}
                        icon={AlertTriangle}
                        color="orange"
                        trend="+3 ce matin"
                    />
                    <StatCard
                        title="Rapports Terrain"
                        value={stats.pendingReports}
                        icon={Activity}
                        color="blue"
                        trend="En attente"
                    />
                    <StatCard
                        title="Cas Résolus"
                        value={stats.resolvedToday}
                        icon={CheckCircle2}
                        color="green"
                        trend="Aujourd'hui"
                    />
                    <StatCard
                        title="Risque Global"
                        value="MODÉRÉ"
                        icon={ShieldAlert}
                        color="navy"
                        trend="Stable"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Colonne Principale: Alertes Urgentes */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-lg font-black text-keneya-navy flex items-center gap-3">
                                    <ShieldAlert className="text-red-500" />
                                    Alertes Critiques du District
                                </h2>
                                <button className="text-xs font-black text-keneya-green uppercase tracking-widest hover:underline">Voir tout</button>
                            </div>

                            <div className="space-y-4">
                                <AlertItem
                                    disease="Choléra Suspect"
                                    location="Abobo Nord (Akeikoi)"
                                    severity="rouge"
                                    time="15 min"
                                    agents={2}
                                />
                                <AlertItem
                                    disease="Mpox (Signalement)"
                                    location="Abobo Baoulé"
                                    severity="jaune"
                                    time="1h"
                                    agents={1}
                                />
                                <AlertItem
                                    disease="Fièvre Inexpliquée"
                                    location="Abobo Gare"
                                    severity="jaune"
                                    time="2h"
                                    agents={3}
                                />
                            </div>
                        </div>

                        {/* Graphique de tendance (Visuel simple) */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h2 className="text-lg font-black text-keneya-navy flex items-center gap-3 mb-6">
                                <TrendingUp className="text-keneya-green" />
                                Tendance Épidémique (7 jours)
                            </h2>
                            <div className="h-48 w-full flex items-end gap-2 px-2">
                                {[40, 70, 45, 90, 65, 30, 80].map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div
                                            className="w-full bg-slate-100 rounded-t-xl group-hover:bg-keneya-green transition-all relative"
                                            style={{ height: `${h}%` }}
                                        >
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 opacity-0 group-hover:opacity-100">{h}</div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Lun.{i}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Colonne Latérale: Agents & Zones */}
                    <div className="space-y-6">
                        <div className="bg-keneya-navy rounded-[2.5rem] p-8 text-white shadow-2xl shadow-keneya-navy/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                            <h3 className="text-lg font-black mb-6 relative z-10">Outils Rapides</h3>
                            <div className="space-y-3 relative z-10">
                                <button className="w-full py-4 bg-white/10 hover:bg-white/20 transition-all rounded-2xl flex items-center justify-between px-6 border border-white/5">
                                    <span className="text-xs font-black uppercase tracking-widest">Envoyer Notification SMS</span>
                                    <ChevronRight size={16} />
                                </button>
                                <button className="w-full py-4 bg-white/10 hover:bg-white/20 transition-all rounded-2xl flex items-center justify-between px-6 border border-white/5">
                                    <span className="text-xs font-black uppercase tracking-widest">Rapport Hebdomadaire</span>
                                    <ChevronRight size={16} />
                                </button>
                                <button className="w-full py-4 bg-keneya-green text-white shadow-lg shadow-keneya-green/20 rounded-2xl flex items-center justify-between px-6">
                                    <span className="text-xs font-black uppercase tracking-widest">Réunion de Crise</span>
                                    <ArrowUpRight size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h2 className="text-lg font-black text-keneya-navy mb-6">Zones à Surveiller</h2>
                            <div className="space-y-4">
                                <ZoneItem name="Abobo Nord" status="warning" count={8} color="orange" />
                                <ZoneItem name="Abobo Gare" status="safe" count={3} color="green" />
                                <ZoneItem name="Abobo Baoulé" status="critical" count={14} color="red" />
                            </div>
                        </div>
                    </div>

                </div>

            </main>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
    const colors: any = {
        orange: 'bg-orange-50 text-orange-600',
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        navy: 'bg-slate-100 text-keneya-navy'
    };

    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-lg shadow-slate-200/50 border border-slate-100 group hover:scale-[1.02] transition-transform">
            <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                <p className="text-2xl font-black text-keneya-navy">{value}</p>
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <TrendingUp size={12} className="text-keneya-green" /> {trend}
                </p>
            </div>
        </div>
    );
}

function AlertItem({ disease, location, severity, time, agents }: any) {
    return (
        <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all border-l-4"
            style={{ borderLeftColor: severity === 'rouge' ? '#EF4444' : '#F59E0B' }}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${severity === 'rouge' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
                    <AlertTriangle size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900">{disease}</h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <MapPin size={12} /> {location} • <Clock size={12} /> {time}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">
                    {agents} agents mobilisés
                </div>
                <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <ChevronRight size={16} className="text-slate-400" />
                </button>
            </div>
        </div>
    );
}

function ZoneItem({ name, count, color }: any) {
    const dots: any = {
        red: 'bg-red-500',
        orange: 'bg-orange-500',
        green: 'bg-green-500'
    };
    return (
        <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${dots[color]}`}></div>
                <span className="text-xs font-bold text-slate-700">{name}</span>
            </div>
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                {count} CAS
            </span>
        </div>
    );
}
