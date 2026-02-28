-- ==========================================
-- TABLE: diseases
-- DESCRIPTION: Table de configuration dynamique des maladies surveillées.
-- Permet à l'administrateur de définir les mots-clés qui déclencheront
-- la détection IA dans les signalements.
-- ==========================================

CREATE TABLE IF NOT EXISTS public.diseases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    severity_level TEXT CHECK (severity_level IN ('vert', 'jaune', 'rouge')) DEFAULT 'vert',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Active RLS (Row Level Security)
ALTER TABLE public.diseases ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité (RBAC)
-- Les admins peuvent tout faire (CRUD)
CREATE POLICY "Admins can manage diseases"
    ON public.diseases
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Les agents (et autres) ne peuvent que lire la liste des maladies
CREATE POLICY "Anyone authenticated can view diseases"
    ON public.diseases
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
    );

-- ==========================================
-- TRIGGER POUR UPDATED_AT
-- ==========================================
CREATE OR REPLACE FUNCTION update_modified_column_diseases()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_diseases_modtime
    BEFORE UPDATE ON public.diseases
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column_diseases();

-- ==========================================
-- DONNEES DE TEST / INITIALISATION
-- ==========================================
INSERT INTO public.diseases (name, keywords, severity_level)
VALUES 
    ('Paludisme Sévère', ARRAY['palu', 'moustique', 'chaud', 'grelotte', 'anémie'], 'jaune'),
    ('Choléra', ARRAY['diarrhée', 'eau de riz', 'vomissement', 'déshydratation', 'soif'], 'rouge'),
    ('Mpox / Variole', ARRAY['bouton', 'éruption', 'peau', 'rash', 'rougeole', 'ganglion'], 'rouge'),
    ('Fièvre Lassa', ARRAY['saigne', 'sang', 'fièvre forte', 'yeux rouges'], 'rouge'),
    ('Dengue', ARRAY['douleur', 'articulation', 'moustique', 'fièvre', 'tête'], 'jaune')
ON CONFLICT (name) DO NOTHING;
