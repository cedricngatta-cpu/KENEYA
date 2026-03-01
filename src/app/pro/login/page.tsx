'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Lock, Phone, AlertCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Pour KENEYA, on utilise l'email simulé via le téléphone pour Supabase Auth simple
            // ou on peut utiliser le téléphone directement si configuré.
            // Ici on simule une connexion par téléphone (simplifiée pour le prototype)
            const cleanPhone = phone.replace(/\s+/g, '')
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: `${cleanPhone}@keneya.ci`,
                password: password,
            })

            if (authError) throw authError

            // Récupération du rôle pour redirection
            const { data: userData, error: userError } = await (supabase as any)
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single()

            if (userError) throw userError

            // Redirection selon le rôle
            switch (userData.role) {
                case 'admin':
                    router.push('/admin')
                    break
                case 'health_center':
                    router.push('/dashboard/center')
                    break
                case 'community_agent':
                    router.push('/dashboard/agent')
                    break
                default:
                    router.push('/')
            }
        } catch (err: any) {
            setError(err.message || "Erreur de connexion. Vérifiez vos identifiants.")
        } finally {
            setLoading(false)
        }
    }

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })
            if (error) throw error
        } catch (err: any) {
            setError(err.message || `Erreur lors de la connexion avec ${provider}`)
        }
    }

    return (
        <div className="min-h-screen bg-keneya-navy flex items-center justify-center p-4 relative overflow-hidden">
            {/* Glow Effect */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-keneya-green/10 rounded-full blur-[120px] animate-pulse"></div>

            <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-12 relative z-10 shadow-2xl">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl overflow-hidden p-2">
                        <Image src="/logo-keneya.png" alt="Logo" width={80} height={80} className="object-contain mix-blend-multiply" />
                    </div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter">KENEYA <span className="text-keneya-green-light">PRO</span></h1>
                    <p className="text-slate-400 font-medium text-sm mt-2">Portail Professionnel de Santé</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-keneya-red/10 border border-keneya-red/30 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="text-keneya-red-light shrink-0" size={18} />
                        <p className="text-xs text-keneya-red-light font-bold leading-tight">{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Numéro de Téléphone</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-keneya-green-light transition-colors">
                                <Phone size={18} />
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="01 02 03 04 05"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-keneya-green-light focus:bg-white/10 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Mot de Passe</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-keneya-green-light transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-keneya-green-light focus:bg-white/10 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group w-full py-5 bg-keneya-green text-white rounded-2xl font-black text-lg shadow-xl shadow-keneya-green/20 hover:bg-keneya-green-light hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 mt-4"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                Se Connecter
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {/* SOCIAL LOGIN SEPARATOR */}
                <div className="relative my-10">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                        <span className="bg-keneya-navy px-4 text-slate-500">Ou continuer avec</span>
                    </div>
                </div>

                {/* SOCIAL BUTTONS */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => handleSocialLogin('google')}
                        className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 group"
                    >
                        <Image src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} className="grayscale group-hover:grayscale-0 transition-all" />
                        <span className="text-white text-sm font-bold">Google</span>
                    </button>
                    <button
                        onClick={() => handleSocialLogin('apple')}
                        className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 group"
                    >
                        <Image src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple" width={18} height={18} className="invert opacity-50 group-hover:opacity-100 transition-all" />
                        <span className="text-white text-sm font-bold">Apple</span>
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-xs font-medium">
                        Pas encore de compte ?{' '}
                        <Link href="/pro/signup" className="text-keneya-green-light font-black hover:underline">
                            S'inscrire
                        </Link>
                    </p>
                </div>

                <p className="mt-4 text-center text-slate-600 text-[10px] font-medium italic">
                    Système sécurisé d'Abidjan • KENEYA v2.0
                </p>
            </div>
        </div>
    )
}
