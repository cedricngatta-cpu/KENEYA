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

// Traductions hybrides (Contexte local, Termes Médicaux en FR pour précision)
const dioulaTranslations: Record<string, string> = {
    'greeting': 'I ni tché. É bɛ mun kɛ ?',
    'select_lang': 'I ka kan sugandi',
    'gps_request': 'I dɛmɛnna kadi, n bɛ a fɛ ka i sɔrɔ yɔrɔ lɔn. Fen dogonin dɔ bɛna n’i ka gasi la: lɔn k’a lɔ k’a fɔ ko **AUTORISER**.',
    'ask_vitals': 'I i tché. An bɛna a daminɛ ni biométrie constantes ye.',
    'ask_fever': 'I bɛ a sɔrɔ ko fari tɛ gbegbe wa? **FIÈVRE** b’i la?',
    'ask_vomiting': 'I bɛ **VOMIR** wa? N’o tɛ i bɛ **DIARRHÉE** kɛ?',
    'ask_rash': 'Boutons b’i fari la wa? **ÉRUPTION CUTANÉE** b’i la?',
};

const baouleTranslations: Record<string, string> = {
    'greeting': 'Mo. É boti ni wa ?',
    'select_lang': 'Faa o ani kpli',
    'gps_request': 'N koni mo i wounou. Sran kun nzan o lika. Flouwa ka o sran nan: miɛ i su ko **AUTORISER**.',
    'ask_fever': 'O wounou hien wa? **FIÈVRE** o i su?',
    'ask_vomiting': 'O **VOMIR** wa? N’o tɛ o kɛ **DIARRHÉE**?',
};

const beteTranslations: Record<string, string> = {
    'greeting': 'A ni ké. Miman o n’on ?',
    'gps_request': 'N n’on gni o djédjé. Gnibi kun o sran. Flouwa o sran nan: miɛ i su ko **AUTORISER**.',
    'ask_fever': 'O wounou hié wa? **FIÈVRE** o i su?',
};

const LanguageContext = createContext<LanguageContextType>({
    userLanguage: 'fr',
    setUserLanguage: () => { },
    t: (key) => defaultTranslations[key] || key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [userLanguage, setUserLanguage] = useState('fr');

    const t = (key: string) => {
        const dicts: Record<string, Record<string, string>> = {
            'dioula': dioulaTranslations,
            'baoule': baouleTranslations,
            'bete': beteTranslations
        };
        const currentDict = dicts[userLanguage];
        return (currentDict && currentDict[key]) || defaultTranslations[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ userLanguage, setUserLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
