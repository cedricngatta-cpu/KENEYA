'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, LayoutDashboard, Users, Bell, Settings, LogOut, Activity, BarChart3, Database, Globe, HeartPulse, Menu, X as CloseIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [userPhone, setUserPhone] = useState('Admin');
    const [alertCount, setAlertCount] = useState(0);
    const [dbOk, setDbOk] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.email) {
                setUserPhone(user.email.split('@')[0]);
            }
        });

        // Charger le nombre de clusters actifs + vérifier la DB
        async function fetchStatus() {
            try {
                const { count, error } = await supabase
                    .from('clusters')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'active');
                setAlertCount(count || 0);
                setDbOk(!error);
            } catch {
                setDbOk(false);
            }
        }
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/pro/login');
    };

    const systemStatus = dbOk ? (alertCount > 0 ? 'Alerte' : 'Optimal') : 'Erreur';
    const statusColor = dbOk ? (alertCount > 0 ? 'text-orange-500' : 'text-keneya-green') : 'text-keneya-red';

    const navItems = [
        { href: '/admin', icon: LayoutDashboard, label: 'Tableau de Bord', exact: true },
        { href: '/admin/utilisateurs', icon: Users, label: 'Gestion Agents' },
        { href: '/admin/cas-cliniques', icon: HeartPulse, label: 'Cas Cliniques' },
        { href: '/admin/moderation', icon: Bell, label: 'Modération Alertes', badge: alertCount },
        { href: '/admin/sig', icon: Globe, label: 'Supervision SIG' },
        { href: '/admin/diseases', icon: Database, label: 'Gestion Maladies' },
        { href: '/admin/systeme', icon: Settings, label: 'Configuration' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans overflow-x-hidden">
            {/* Overlay Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Admin */}
            <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-keneya-navy text-white flex flex-col z-50 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-5 flex items-center justify-between border-b border-white/10">
                    <Link href="/admin" className="relative h-10 w-40 block transition-opacity hover:opacity-80 rounded-xl overflow-hidden isolate">
                        <Image
                            src="/logo-keneya.png"
                            alt="Logo KENEYA"
                            fill
                            className="object-contain object-left invert mix-blend-screen"
                            priority
                        />
                    </Link>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white">
                        <CloseIcon size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto no-scrollbar">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 mt-3 px-3 italic">Écosystème Keneya</div>
                    {navItems.map((item) => {
                        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                    ${isActive
                                        ? `bg-white/10 text-white shadow-lg ring-1 ring-white/20`
                                        : 'hover:bg-white/5 text-slate-400 hover:text-white hover:translate-x-1'
                                    }`}
                            >
                                <item.icon size={18} className={isActive ? 'text-keneya-green-light' : 'text-slate-500'} />
                                <span className={isActive ? 'font-bold text-sm' : 'font-medium text-sm flex-1'}>{item.label}</span>
                                {item.badge && item.badge > 0 ? (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-keneya-red text-[10px] font-black text-white animate-pulse">
                                        {item.badge}
                                    </span>
                                ) : null}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 bg-slate-900/40">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-keneya-red/10 text-keneya-red-light transition-all group">
                        <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
                        <span className="font-bold text-sm">Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden">
                {/* Admin Header Bar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 transition-all">
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-1.5 -ml-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="font-black text-slate-900 text-[10px] md:text-base flex items-center gap-2 truncate max-w-[120px] md:max-w-none">
                            Console de Pilotage
                        </h2>
                        <div className="hidden sm:block h-4 w-px bg-slate-200 mx-1" />
                        <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <Activity size={12} className={statusColor} /> État: <span className={`${statusColor} font-black`}>{systemStatus}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="hidden lg:flex items-center gap-3 text-[10px] sm:text-xs font-bold">
                            <div className={`flex items-center gap-1.5 ${dbOk ? 'text-keneya-green' : 'text-keneya-red'}`}>
                                <Database size={12} /> DB: {dbOk ? 'OK' : 'ERR'}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <Globe size={12} /> SIG: OK
                            </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                            <span className="text-xs md:text-sm font-black text-keneya-navy leading-none">Admin</span>
                            <span className="text-[8px] md:text-[10px] text-keneya-green font-bold uppercase tracking-widest mt-1">{userPhone}</span>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm relative shrink-0">
                            <Shield size={18} />
                            {alertCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 rounded-full border-2 border-white text-white text-[8px] font-black flex items-center justify-center">
                                    {alertCount}
                                </span>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 md:p-8 overflow-auto no-scrollbar flex flex-col w-full">
                    <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden">
                        {children}
                    </div>
                    <footer className="mt-8 pt-6 border-t border-slate-200 text-center pb-6">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            Console de Pilotage KENEYA • Mairie d'Abidjan • v2.0
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
}

