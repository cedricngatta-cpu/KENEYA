'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type LanguageContextType = {
    userLanguage: string;
    setUserLanguage: (lang: string) => void;
    // Fonction de traduction simulée
    t: (key: string) => string;
};

const defaultTranslations: Record<string, string> = {
    // Français de base (Fallback)
    'greeting': 'Bonjour, que puis-je pour vous ?',
    'select_lang': 'Choisissez votre langue / ethnie',
    'symptom_fever': 'Fièvre',
    'symptom_cough': 'Toux',
    'symptom_diarrhea': 'Diarrhée',
    'symptom_rash': 'Boutons',
    'report_case': 'Signaler un cas (Vocal)',
    'view_map': 'Voir la carte',
};

// Traductions locales (Les mots cliniques restent en FR)
const dioulaTranslations: Record<string, string> = {
    'greeting': 'I ni tché. É bɛ mun kɛ ?',
    'select_lang': 'I ka kan sugandi',
    'report_case': 'A fɔ (Signaler)',
    'view_map': 'Karta lajɛ',
};

const LanguageContext = createContext<LanguageContextType>({
    userLanguage: 'fr',
    setUserLanguage: () => { },
    t: (key) => defaultTranslations[key] || key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [userLanguage, setUserLanguage] = useState('fr');

    const t = (key: string) => {
        if (userLanguage === 'dioula') {
            return dioulaTranslations[key] || defaultTranslations[key] || key;
        }
        return defaultTranslations[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ userLanguage, setUserLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
