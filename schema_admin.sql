-- SCHÉMA POUR LE MODULE D'ADMINISTRATION
-- =======================================

-- 1. Table des Maladies (Dictionnaire IA)
CREATE TABLE IF NOT EXISTS public.diseases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    severity_level TEXT CHECK (severity_level IN ('vert', 'jaune', 'rouge')) DEFAULT 'jaune',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertion de quelques maladies par défaut pour l'Afrique de l'Ouest
INSERT INTO public.diseases (name, keywords, severity_level) VALUES
('Paludisme grave', ARRAY['palu', 'moustique', 'chaud', 'grelotte', 'grelotement', 'frisson'], 'rouge'),
('Choléra', ARRAY['diarrhée', 'eau de riz', 'déshydratation', 'selles liquides'], 'rouge'),
('Fièvre Typhoïde', ARRAY['typhoïde', 'fièvre continue', 'maux de tête', 'douleur abdominale'], 'jaune'),
('Dengue', ARRAY['dengue', 'douleur articulaire', 'courbature', 'yeux rouges'], 'jaune'),
('Mpox (Variole Simienne)', ARRAY['variole', 'boutons', 'éruption cutanée', 'vésicules', 'fièvre'], 'rouge'),
('Fièvre Jaune', ARRAY['jaunisse', 'ictère', 'yeau jaunes', 'sang'], 'rouge'),
('Ebola / Marburg', ARRAY['saignement', 'hémorragie', 'sang', 'vomissement de sang'], 'rouge')
ON CONFLICT DO NOTHING;

-- 2. Table de Configuration Système
CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertion des réglages par défaut
INSERT INTO public.system_config (key, value) VALUES
('alert_threshold', '5'),
('ai_confidence_threshold', '85'),
('human_moderation', 'true'),
('auto_validation_critical', 'true'),
('whatsapp_notifications', 'true'),
('double_auth', 'false')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Table des Clusters (Détection IA Automatique)
DROP TABLE IF EXISTS public.clusters CASCADE;
CREATE TABLE public.clusters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    geo_cell TEXT NOT NULL,
    syndrome TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'resolved', 'rejected')) DEFAULT 'active',
    time_window TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Sécurité (RLS - Désactivée temporairement ou configurée)
ALTER TABLE public.diseases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clusters DISABLE ROW LEVEL SECURITY;
