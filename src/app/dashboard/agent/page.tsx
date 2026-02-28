'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    PlusCircle, MapPin, Activity, Mic,
    ShieldAlert, CheckCircle2, List,
    TrendingUp, LogOut, Users, Bell
} from 'lucide-react';
import Link from 'next/link';
import FastAgentForm from './FastAgentForm'; // On va extraire le formulaire dans un composant séparé

export default function AgentDashboard() {
    const supabase = createClient();
    const [showForm, setShowForm] = useState(false);
    const [stats, setStats] = useState({ today: 0, total: 0 });

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: todayCount } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        const { count: totalCount } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true });

        setStats({ today: todayCount || 0, total: totalCount || 0 });
    }

    if (showForm) {
        return <div className="min-h-screen bg-white">
            <button
                onClick={() => { setShowForm(false); fetchStats(); }}
                className="fixed top-6 left-6 z-[60] p-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
            >
                Retour au Dashboard
            </button>
            <div className="pt-16">
                <FastAgentForm />
            </div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB] pb-20">
            {/* Top Bar Navigation */}
            <div className="bg-white border-b border-orange-100/50 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-keneya-navy flex items-center justify-center shadow-lg shadow-keneya-navy/20">
                        <Users size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-keneya-navy leading-tight">Espace Agent</h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terrain • Abidjan</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                </div>
            </div>

            <main className="p-6 space-y-8 max-w-4xl mx-auto">

                {/* Hero / Action Section */}
                <div className="bg-gradient-to-br from-keneya-navy to-slate-800 rounded-[3rem] p-8 text-white shadow-2xl shadow-keneya-navy/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-keneya-green/10 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black italic">Bon travail !</h2>
                            <p className="text-sm text-slate-300 font-medium">Vous avez déjà transmis {stats.today} signalements aujourd'hui.</p>
                        </div>

                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full py-5 bg-keneya-green hover:bg-keneya-green/90 text-white rounded-3xl shadow-xl shadow-keneya-green/30 flex items-center justify-center gap-4 group/btn transition-all"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                <Mic size={24} className="text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black uppercase tracking-widest text-white/70">Action Prioritaire</p>
                                <p className="text-lg font-black">Nouveau Signalement IA</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-2 group hover:border-keneya-green transition-colors">
                        <div className="w-12 h-12 rounded-full bg-keneya-green/10 flex items-center justify-center group-hover:bg-keneya-green transition-colors">
                            <CheckCircle2 size={24} className="text-keneya-green group-hover:text-white transition-colors" />
                        </div>
                        <p className="text-2xl font-black text-keneya-navy">{stats.today}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rapports Jour</p>
                    </div>
                    <Link href="/dashboard/map" className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-2 group hover:border-keneya-navy transition-colors">
                        <div className="w-12 h-12 rounded-full bg-keneya-navy/5 flex items-center justify-center group-hover:bg-keneya-navy transition-colors">
                            <MapPin size={24} className="text-keneya-navy group-hover:text-white transition-colors" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Voir la Carte</p>
                        <p className="text-xs font-bold text-keneya-navy underline">Zone Abidjan</p>
                    </Link>
                </div>

                {/* Flux d'activité récent */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-keneya-navy flex items-center gap-3">
                            <Activity className="text-keneya-green" /> Flux d'activité
                        </h3>
                        <List size={20} className="text-slate-300" />
                    </div>

                    <div className="space-y-6">
                        <ActivityItem
                            title="Signalement transmis"
                            subtitle="Abobo Sud • 45 ans • Fièvre"
                            time="Il y a 12 min"
                            status="envoyé"
                        />
                        <ActivityItem
                            title="Signalement transmis"
                            subtitle="Abobo Nord • 12 ans • Digestif"
                            time="Il y a 1h"
                            status="envoyé"
                        />
                        <div className="pt-4 text-center">
                            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-keneya-navy transition-colors">Charger l'historique complet</button>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}

function ActivityItem({ title, subtitle, time, status }: any) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-keneya-green/5 transition-colors">
                    <ShieldAlert size={18} className="text-slate-400 group-hover:text-keneya-green transition-colors" />
                </div>
                <div>
                    <p className="text-sm font-black text-slate-800">{title}</p>
                    <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400">{time}</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-keneya-green"></div>
                    <span className="text-[8px] font-black uppercase text-keneya-green tracking-widest">{status}</span>
                </div>
            </div>
        </div>
    );
}
