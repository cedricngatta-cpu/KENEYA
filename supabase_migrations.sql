-- ========== MIGRATION SUPABASE POUR HEALTH-TECH ==========
-- 1. Ajout des nouvelles colonnes à la table `reports`
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS patient_name TEXT,
ADD COLUMN IF NOT EXISTS patient_phone TEXT,
ADD COLUMN IF NOT EXISTS symptoms_text TEXT,
ADD COLUMN IF NOT EXISTS suspected_illness TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 2. Configuration RLS (Row-Level Security) pour autoriser les signalements
-- Permet à n'importe quel visiteur (anon) d'insérer un signalement vocal ou de triage
CREATE POLICY "Autoriser l'insertion des signalements (public)" ON public.reports
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Astuce : Vous pouvez aussi exécuter `ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;` 
-- si ce n'est pas déjà activé.
