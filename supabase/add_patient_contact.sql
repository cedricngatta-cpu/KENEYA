-- ============================================================
-- MIGRATION: Ajouter patient_name et patient_phone dans reports
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Ajout des colonnes dans la table reports
ALTER TABLE public.reports
    ADD COLUMN IF NOT EXISTS patient_name TEXT,
    ADD COLUMN IF NOT EXISTS patient_phone TEXT,
    ADD COLUMN IF NOT EXISTS suspected_illness TEXT,
    ADD COLUMN IF NOT EXISTS symptoms_text TEXT;

-- 2. Permettre aux citoyens non-connectés d'insérer un signalement (flux vocal)
-- On crée une politique publique pour les signalements citoyens sans compte
DROP POLICY IF EXISTS "citizen_insert_report" ON public.reports;
CREATE POLICY "public_insert_report" ON public.reports FOR INSERT
WITH CHECK (true);

-- 3. Les Centres de Santé peuvent lire les signalements dans leur zone
DROP POLICY IF EXISTS "center_read_reports" ON public.reports;
CREATE POLICY "center_read_reports" ON public.reports FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('health_center', 'admin'))
);

-- 4. Les admins peuvent mettre à jour les reports
DROP POLICY IF EXISTS "admin_update_report" ON public.reports;
CREATE POLICY "admin_update_report" ON public.reports FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
