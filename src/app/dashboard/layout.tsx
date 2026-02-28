'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, FileText, Map, Settings, LogOut, Users, Activity, BellRing } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const [alertCount, setAlertCount] = useState(0);

    useEffect(() => {
        async function fetchStatus() {
            try {
                const { count } = await supabase
                    .from('clusters')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'active');
                setAlertCount(count || 0);
            } catch { }
        }
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // refresh 30s
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        // Supabase auth signout will be here
        router.push('/pro/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar - Masquée si on est sur la map */}
            <aside className={`fixed left-0 top-0 bottom-0 w-56 bg-keneya-navy text-white flex flex-col z-20 shadow-xl transition-transform duration-300 ${pathname?.startsWith('/dashboard/map') ? '-translate-x-full' : 'translate-x-0'}`}>
                <div className="p-5 flex items-center gap-3 border-b border-white/10">
                    <Link href="/dashboard" className="relative h-10 w-40 block transition-opacity hover:opacity-80 rounded-xl overflow-hidden isolate">
                        <Image
                            src="/logo-keneya.png"
                            alt="Logo KENEYA"
                            fill
                            className="object-contain object-left invert mix-blend-screen"
                        />
                    </Link>
                </div>

                <nav className="flex-1 p-3 space-y-1">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 mt-3 px-3">Opérations</div>

                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors">
                        <LayoutDashboard size={18} />
                        <span className="font-medium text-sm">Vue Centrale</span>
                    </Link>

                    <Link href="/dashboard/center" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-emerald-300 hover:text-emerald-200 transition-colors bg-emerald-500/5 border border-emerald-500/10">
                        <Activity size={18} />
                        <span className="font-bold text-sm">Centre de Santé</span>
                    </Link>

                    <Link href="/dashboard/agent" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors">
                        <FileText size={18} />
                        <span className="font-medium text-sm">Saisie (&lt; 60s)</span>
                    </Link>

                    <Link href="/dashboard/map" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-keneya-green-light hover:text-keneya-green transition-colors bg-keneya-green/5 border border-keneya-green/20">
                        <Map size={18} />
                        <span className="font-bold text-sm">SIG Radar</span>
                    </Link>

                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 mt-6 px-3">Administration</div>

                    <Link href="/dashboard/teams" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <Users size={18} />
                        <span className="font-medium text-sm">Équipes</span>
                    </Link>

                    <Link href="/dashboard/alerts" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <div className="relative">
                            <BellRing size={18} />
                            {alertCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-keneya-navy"></span>
                            )}
                        </div>
                        <span className="font-medium text-sm flex-1">Alertes</span>
                        {alertCount > 0 && <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-black">{alertCount}</span>}
                    </Link>

                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <Settings size={18} />
                        <span className="font-medium text-sm">Réglages</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl hover:bg-keneya-red/10 text-keneya-red-light transition-all">
                        <LogOut size={18} />
                        <span className="font-bold text-sm">Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${pathname?.startsWith('/dashboard/map') ? 'ml-0' : 'ml-56'}`}>

                {/* Header Bar - Masqué conditionnellement ou rendu flottant pour le retour  */}
                {!pathname?.startsWith('/dashboard/map') ? (
                    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-[40] transition-all">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-keneya-green animate-pulse"></span>
                            <span className="text-xs font-bold text-slate-600">Serveur Connecté</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-keneya-navy">Portail Pro</span>
                                <span className="text-[10px] text-keneya-green font-bold uppercase tracking-widest">Connecté</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                                <Shield size={16} />
                            </div>
                        </div>
                    </header>
                ) : (
                    /* Bouton retour flottant discret sur la map */
                    <div className="fixed top-6 left-6 z-50">
                        <Link href="/dashboard" className="px-5 py-3 bg-keneya-navy/80 hover:bg-keneya-navy backdrop-blur text-white font-bold rounded-xl shadow-2xl flex items-center gap-2 border border-white/10 transition-colors">
                            <LayoutDashboard size={18} /> Quitter le Radar
                        </Link>
                    </div>
                )}

                <div className="flex-1 overflow-auto bg-slate-50 relative flex flex-col">
                    <div className="flex-1">
                        {children}
                    </div>
                    <footer className="p-6 border-t border-slate-200 bg-white text-center">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            Système sécurisé d'Abidjan • KENEYA v2.0
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
