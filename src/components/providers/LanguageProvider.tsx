'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type LanguageContextType = {
    userLanguage: string;
    setUserLanguage: (lang: string) => void;
    // Fonction de traduction simulée
    t: (key: string) => string;
};

const defaultTranslations: Record<string, string> = {
    'greeting': 'Bonjour, que puis-je pour vous ?',
    'select_lang': 'Choisissez votre langue / ethnie',
    'view_map': 'Voir la carte',
    'gps_request': 'L’accès GPS est nécessaire pour localiser l’alerte. Une fenêtre va s’ouvrir, veuillez cliquer sur AUTORISER.',
    'ask_fever': 'Avez-vous de la fièvre ou des maux de tête depuis moins de 48 heures ?',
    'ask_vomiting': 'Souffrez-vous de vomissements ou de diarrhées intenses ?',
    'ask_rash': 'Avez-vous des boutons ou des plaques rouges sur la peau ?',
    'ask_contact_info': 'Veuillez nous dire votre nom et votre numéro de téléphone.',
    'ask_vitals': 'Nous allons maintenant relever vos constantes biométriques. Veuillez rester immobile.',
    'vitals_measuring': 'Mesure des constantes en cours... Veuillez patienter.',
};

// Traductions hybrides (Contexte local, Termes Médicaux en FR pour précision)
const dioulaTranslations: Record<string, string> = {
    'greeting': 'I ni tché. É bɛ mun kɛ ?',
    'select_lang': 'I ka kan sugandi',
    'gps_request': 'I dɛmɛnna kadi, n bɛ a fɛ ka i sɔrɔ yɔrɔ lɔn. Fen dogonin dɔ bɛna n’i ka gasi la: lɔn k’a lɔ k’a fɔ ko **AUTORISER**.',
    'ask_fever': 'I bɛ a sɔrɔ ko fari tɛ gbegbe wa? **FIÈVRE** b’i la?',
    'ask_vomiting': 'I bɛ **VOMIR** wa? N’o tɛ i bɛ **DIARRHÉE** kɛ?',
    'ask_rash': 'Boutons b’i fari la wa? **ÉRUPTION CUTANÉE** b’i la?',
    'ask_contact_info': 'I tɔgɔ n’i ka nimɛrɔ fɔ an ye.',
    'ask_vitals': 'An bɛna a daminɛ ni biométrie constantes ye. I tlo de i sɔrɔ.',
    'vitals_measuring': 'Constantes jaatélila... I tlo de.',
};

const baouleTranslations: Record<string, string> = {
    'greeting': 'Mo. É boti ni wa ?',
    'select_lang': 'Faa o ani kpli',
    'gps_request': 'N koni mo i wounou. Sran kun nzan o lika. Flouwa ka o sran nan: miɛ i su ko **AUTORISER**.',
    'ask_fever': 'O wounou hien wa? **FIÈVRE** o i su?',
    'ask_vomiting': 'O **VOMIR** wa? N’o tɛ o kɛ **DIARRHÉE**?',
    'ask_contact_info': 'Amun dunman ni niméro ye o yɛ?',
    'ask_vitals': 'An bɛna biométrie kplin. I kpli ni kpli.',
    'vitals_measuring': 'Biométrie kplin kplin...',
};

const beteTranslations: Record<string, string> = {
    'greeting': 'A ni ké. Miman o n’on ?',
    'gps_request': 'N n’on gni o djédjé. Gnibi kun o sran. Flouwa o sran nan: miɛ i su ko **AUTORISER**.',
    'ask_fever': 'O wounou hié wa? **FIÈVRE** o i su?',
    'ask_contact_info': 'N’on fɔ miman ni niméro.',
    'ask_vitals': 'N’on fɔ biométrie constantes.',
    'vitals_measuring': 'Biométrie constantes kplin...',
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
