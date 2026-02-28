'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectAdmin() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin');
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-keneya-navy border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold animate-pulse text-sm uppercase tracking-widest">
                    Migration vers le Dashboard Admin Indépendant...
                </p>
            </div>
        </div>
    );
}
