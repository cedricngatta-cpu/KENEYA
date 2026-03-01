'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Lock, Phone, AlertCircle, ArrowRight, CheckCircle, Shield, HeartPulse, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

const ROLES = [
    { value: 'community_agent', label: 'Agent Terrain', icon: Users, desc: 'Collecte terrain', color: 'border-blue-500 text-blue-400' },
    { value: 'health_center', label: 'Centre de Santé', icon: HeartPulse, desc: 'Prise en charge', color: 'border-emerald-500 text-emerald-400' },
]

export default function SignupPage() {
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [role, setRole] = useState('community_agent')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Validations
        if (!phone.trim()) {
            setError('Veuillez entrer un numéro de téléphone')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères')
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            setLoading(false)
            return
        }

        try {
            const email = `${phone.replace(/\s+/g, '')}@keneya.ci`

            // Création du compte dans Supabase Auth
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
            })

            if (authError) {
                if (authError.message.includes('already registered')) {
                    setError('Ce numéro de téléphone est déjà inscrit. Connectez-vous.')
                } else {
                    setError(authError.message)
                }
                setLoading(false)
                return
            }

            // Mise à jour du profil avec le rôle et le téléphone
            if (data.user) {
                await (supabase as any).from('users').upsert({
                    id: data.user.id,
                    role: role,
                    phone: phone.replace(/\s+/g, ''),
                    language: 'fr',
                }, { onConflict: 'id' })
            }

            setSuccess(true)

            // Redirection après 2 secondes
            setTimeout(() => {
                switch (role) {
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
            }, 2000)

        } catch (err: any) {
            setError(err.message || "Erreur lors de l'inscription.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-keneya-navy flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-keneya-green/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-12 relative z-10 shadow-2xl text-center">
                    <div className="w-20 h-20 bg-keneya-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-keneya-green-light" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Inscription Réussie ! 🎉</h2>
                    <p className="text-slate-400 text-sm font-medium mb-6">
                        Votre compte <span className="text-keneya-green-light font-bold">{phone}</span> a été créé avec succès.
                    </p>
                    <p className="text-slate-500 text-xs">Redirection en cours...</p>
                    <div className="mt-4 w-8 h-8 border-4 border-keneya-green/30 border-t-keneya-green rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-keneya-navy flex items-center justify-center p-4 relative overflow-hidden">
            {/* Glow Effect */}
            <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-keneya-green/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px]"></div>

            <div className="w-full max-w-lg bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 relative z-10 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20 shadow-xl overflow-hidden">
                        <div className="w-24 h-24 flex items-center justify-center mb-6 overflow-hidden">
                            <Image src="/logo-keneya.png" alt="Logo" width={80} height={80} className="object-contain invert mix-blend-screen" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-white italic tracking-tighter">Créer un Compte <span className="text-keneya-green-light">KENEYA</span></h1>
                    <p className="text-slate-400 font-medium text-xs mt-1">Rejoignez le réseau de santé d'Abidjan</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-keneya-red/10 border border-keneya-red/30 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="text-keneya-red-light shrink-0" size={18} />
                        <p className="text-xs text-keneya-red-light font-bold leading-tight">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-5">
                    {/* Téléphone */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Numéro de Téléphone</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-keneya-green-light transition-colors">
                                <Phone size={18} />
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="05 06 07 08 09"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-keneya-green-light focus:bg-white/10 transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Mot de passe */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Mot de Passe</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-keneya-green-light transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimum 6 caractères"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-keneya-green-light focus:bg-white/10 transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Confirmer */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Confirmer le Mot de Passe</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-keneya-green-light transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-keneya-green-light focus:bg-white/10 transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Sélection du rôle */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Votre Profil</label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.map((r) => (
                                <button
                                    type="button"
                                    key={r.value}
                                    onClick={() => setRole(r.value)}
                                    className={`p-3 rounded-2xl border-2 transition-all text-left ${role === r.value
                                        ? 'bg-keneya-green/20 border-keneya-green text-white shadow-lg shadow-keneya-green/10'
                                        : `bg-white/5 ${r.color} border-white/10 hover:bg-white/10`
                                        }`}
                                >
                                    <r.icon size={18} className={role === r.value ? 'text-keneya-green-light mb-1' : 'mb-1 opacity-60'} />
                                    <div className={`text-xs font-black ${role === r.value ? 'text-white' : ''}`}>{r.label}</div>
                                    <div className={`text-[9px] ${role === r.value ? 'text-keneya-green-light' : 'text-slate-500'}`}>{r.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bouton Inscription */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="group w-full py-5 bg-keneya-green text-white rounded-2xl font-black text-lg shadow-xl shadow-keneya-green/20 hover:bg-keneya-green-light hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 mt-2"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                S'inscrire
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-500 text-xs font-medium">
                        Déjà inscrit ?{' '}
                        <Link href="/pro/login" className="text-keneya-green-light font-black hover:underline">
                            Se connecter
                        </Link>
                    </p>
                </div>

                <p className="mt-6 text-center text-slate-600 text-[10px] font-medium italic">
                    Système sécurisé d'Abidjan • KENEYA v2.0
                </p>
            </div>
        </div>
    )
}
