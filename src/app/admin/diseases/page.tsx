'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, Search, Save, X, Activity, AlertTriangle, Syringe } from 'lucide-react';

const supabase = createClient();

type Disease = {
    id: string;
    name: string;
    keywords: string[];
    severity_level: 'vert' | 'jaune' | 'rouge';
};

export default function DiseasesAdminPage() {
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDisease, setEditingDisease] = useState<Disease | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        keywords: '',
        severity_level: 'vert' as 'vert' | 'jaune' | 'rouge'
    });

    useEffect(() => {
        fetchDiseases();
    }, []);

    const fetchDiseases = async () => {
        setIsLoading(true);
        const { data, error } = await (supabase as any)
            .from('diseases')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching diseases:', error);
            // Fallback pour la démo si la table n'est pas encore créée
            setDiseases([
                { id: '1', name: 'Paludisme', keywords: ['palu', 'moustique', 'chaud'], severity_level: 'jaune' },
                { id: '2', name: 'Choléra', keywords: ['diarrhée', 'eau de riz'], severity_level: 'rouge' }
            ]);
        } else if (data) {
            setDiseases(data);
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        const keywordArray = formData.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);

        if (editingDisease) {
            // Mise à jour
            const { error } = await (supabase as any)
                .from('diseases')
                .update({
                    name: formData.name,
                    keywords: keywordArray,
                    severity_level: formData.severity_level,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingDisease.id);

            if (!error) {
                setDiseases(diseases.map(d => d.id === editingDisease.id ? { ...editingDisease, name: formData.name, keywords: keywordArray, severity_level: formData.severity_level } : d));
                closeModal();
            } else {
                alert("Erreur lors de la mise à jour");
            }
        } else {
            // Création
            const { data, error } = await (supabase as any)
                .from('diseases')
                .insert([{
                    name: formData.name,
                    keywords: keywordArray,
                    severity_level: formData.severity_level
                }])
                .select();

            if (data && !error) {
                setDiseases([...diseases, data[0]]);
                closeModal();
            } else {
                alert("Erreur: Vous n'avez peut-être pas encore exécuté le script SQL dans Supabase.");
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette maladie du système de surveillance ?')) return;

        const { error } = await (supabase as any).from('diseases').delete().eq('id', id);
        if (!error) {
            setDiseases(diseases.filter(d => d.id !== id));
        } else {
            alert("Erreur lors de la suppression");
        }
    };

    const openEditModal = (d: Disease) => {
        setEditingDisease(d);
        setFormData({
            name: d.name,
            keywords: d.keywords.join(', '),
            severity_level: d.severity_level
        });
        setIsModalOpen(true);
    };

    const openNewModal = () => {
        setEditingDisease(null);
        setFormData({
            name: '',
            keywords: '',
            severity_level: 'jaune'
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingDisease(null);
    };

    const getSeverityColor = (level: string) => {
        switch (level) {
            case 'rouge': return 'bg-keneya-red text-white border-keneya-red-light';
            case 'jaune': return 'bg-orange-500 text-white border-orange-400';
            case 'vert': return 'bg-keneya-green text-white border-keneya-green-light';
            default: return 'bg-slate-500 text-white';
        }
    };

    const filteredDiseases = diseases.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* EN-TÊTE */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-slate-200 pb-6 gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-keneya-green/20 rounded-xl flex items-center justify-center text-keneya-green shrink-0">
                            <Syringe size={24} className="md:w-7 md:h-7" />
                        </div>
                        <h1 className="text-xl md:text-3xl font-black text-keneya-navy tracking-tight leading-tight">Registre des Maladies</h1>
                    </div>
                    <p className="text-xs md:text-base text-slate-500 font-medium max-w-2xl">Configurez les pathologies et les mots-clés reconnus par l'Intelligence Artificielle de Triage.</p>
                </div>
                <button
                    onClick={openNewModal}
                    className="flex items-center justify-center gap-2 px-6 py-4 md:py-3 bg-keneya-red text-white font-black md:font-bold rounded-2xl md:rounded-xl shadow-lg hover:bg-keneya-red-light hover:shadow-keneya-red/30 hover:-translate-y-1 transition-all w-full md:w-auto text-sm"
                >
                    <Plus size={20} />
                    Nouvelle Maladie
                </button>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Chercher (diarrhée, fièvre...)"
                    className="flex-1 bg-transparent border-none text-sm md:text-lg font-medium outline-none text-slate-700 placeholder:text-slate-300"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* TABLEAU DES MALADIES */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] md:text-xs uppercase tracking-widest font-black">
                                <th className="p-4 md:p-6">Maladie</th>
                                <th className="p-4 md:p-6 hidden sm:table-cell">Gravité</th>
                                <th className="p-4 md:p-6 w-1/3 md:w-1/2">Mots-clés <span className="hidden md:inline">IA</span></th>
                                <th className="p-4 md:p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 md:p-12 text-center text-slate-400 font-medium text-xs md:text-base">Chargement du dictionnaire médical...</td>
                                </tr>
                            ) : filteredDiseases.map(disease => (
                                <tr key={disease.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-4 md:p-6">
                                        <div className="font-bold text-slate-700 text-sm md:text-lg">{disease.name}</div>
                                        <div className="sm:hidden mt-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getSeverityColor(disease.severity_level)}`}>
                                                {disease.severity_level}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 md:p-6 hidden sm:table-cell">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getSeverityColor(disease.severity_level)}`}>
                                            {disease.severity_level}
                                        </span>
                                    </td>
                                    <td className="p-4 md:p-6">
                                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                                            {disease.keywords.slice(0, 4).map((k, i) => (
                                                <span key={i} className="px-1.5 md:px-2 py-0.5 md:py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] md:text-xs font-bold border border-slate-200">
                                                    {k}
                                                </span>
                                            ))}
                                            {disease.keywords.length > 4 && (
                                                <span className="text-[9px] md:text-xs text-slate-400 font-bold">+{disease.keywords.length - 4}</span>
                                            )}
                                            {disease.keywords.length === 0 && (
                                                <span className="text-slate-300 italic text-[10px] md:text-sm">Aucun</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 md:p-6 text-right space-x-1 md:space-x-2">
                                        <button
                                            onClick={() => openEditModal(disease)}
                                            className="w-8 h-8 md:w-10 md:h-10 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-keneya-green hover:bg-keneya-green/10 transition-colors shrink-0"
                                            title="Modifier"
                                        >
                                            <Edit2 size={16} className="md:w-[18px] md:h-[18px]" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(disease.id)}
                                            className="w-8 h-8 md:w-10 md:h-10 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-keneya-red hover:bg-keneya-red/10 transition-colors shrink-0"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredDiseases.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">Aucune maladie trouvée.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL AJOUT/EDITION */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto overflow-hidden animate-in zoom-in-95">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingDisease ? 'Modifier la maladie' : 'Nouvelle maladie'}
                            </h2>
                            <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-slate-600 hover:shadow-md transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Nom de la Maladie */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nom Officiel</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-keneya-green transition-colors font-medium text-slate-700"
                                    placeholder="Ex: Fièvre Dengue"
                                />
                            </div>

                            {/* Severité */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Niveau d'Alerte par défaut</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {(['vert', 'jaune', 'rouge'] as const).map(level => (
                                        <button
                                            key={level}
                                            onClick={() => setFormData({ ...formData, severity_level: level })}
                                            className={`py-3 rounded-xl border-2 font-black uppercase text-xs tracking-widest transition-all ${formData.severity_level === level
                                                ? level === 'rouge' ? 'border-keneya-red bg-keneya-red/10 text-keneya-red'
                                                    : level === 'jaune' ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                                                        : 'border-keneya-green bg-keneya-green/10 text-keneya-green'
                                                : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-300'
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mots Clés IA */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                                    Mots-clés déclencheurs
                                    <span className="text-[10px] bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full normal-case tracking-normal">Pour le module IA Vocal</span>
                                </label>
                                <textarea
                                    value={formData.keywords}
                                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-keneya-green transition-colors font-medium text-slate-700 resize-none"
                                    placeholder="Séparés par des virgules. Ex: bouton, éruption cutanée, rougeole, plaque rouge..."
                                />
                                <p className="text-xs text-slate-400 italic">Ces mots permettront au micro de l'Alerte Publique et du formulaire Agent de détecter automatiquement cette maladie.</p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={closeModal} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!formData.name}
                                className="px-6 py-3 bg-keneya-navy text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
                            >
                                <Save size={18} />
                                Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
