-- ============================================================
-- MIGRATION COMPLÈTE - Tables KENEYA
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. TABLE REPORTS (Signalements Citoyens)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    citizen_id UUID REFERENCES auth.users(id),
    symptoms JSONB DEFAULT '[]'::jsonb,
    audio_url TEXT,
    geo_cell TEXT,
    severity TEXT CHECK (severity IN ('vert', 'jaune', 'rouge')) DEFAULT 'vert',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLE CLINICAL_CASES (Saisies Centres de santé)
CREATE TABLE IF NOT EXISTS public.clinical_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID REFERENCES auth.users(id),
    syndrome TEXT NOT NULL,
    status TEXT CHECK (status IN ('suspect', 'probable', 'confirmed')) DEFAULT 'suspect',
    tests JSONB,
    severity TEXT CHECK (severity IN ('vert', 'jaune', 'rouge')) DEFAULT 'vert',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLE TRIAGE_RESULTS (Sorties IA)
CREATE TABLE IF NOT EXISTS public.triage_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports(id),
    syndrome TEXT NOT NULL,
    level TEXT CHECK (level IN ('vert', 'jaune', 'rouge')) DEFAULT 'vert',
    recommendations TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLE CLUSTERS (Détection épidémique)
CREATE TABLE IF NOT EXISTS public.clusters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    geo_cell TEXT NOT NULL,
    syndrome TEXT NOT NULL,
    time_window TEXT CHECK (time_window IN ('24h', '72h', '7j')) DEFAULT '24h',
    score NUMERIC DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'resolved')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLE ALERTS (Alertes publiques)
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_area TEXT NOT NULL,
    message_text TEXT NOT NULL,
    audio_url TEXT,
    channel TEXT CHECK (channel IN ('whatsapp', 'sms', 'push')) DEFAULT 'sms',
    sent_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLE AID_REQUESTS (Logistique)
CREATE TABLE IF NOT EXISTS public.aid_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT CHECK (type IN ('transport', 'kits', 'mobile_team')) NOT NULL,
    requester_id UUID REFERENCES auth.users(id),
    status TEXT CHECK (status IN ('pending', 'assigned', 'resolved')) DEFAULT 'pending',
    assigned_team TEXT,
    proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABLE SYMPTOM_CATALOG
CREATE TABLE IF NOT EXISTS public.symptom_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label_fr TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    translations JSONB DEFAULT '{}'::jsonb,
    audio_prompts JSONB DEFAULT '{}'::jsonb
);

-- ============================================================
-- RLS (Row Level Security) pour toutes les tables
-- ============================================================

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aid_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_catalog ENABLE ROW LEVEL SECURITY;

-- Politique : Admin peut tout lire
CREATE POLICY "admin_read_all_reports" ON public.reports FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_read_all_clinical" ON public.clinical_cases FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_read_all_triage" ON public.triage_results FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_read_all_clusters" ON public.clusters FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_read_all_alerts" ON public.alerts FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_read_all_aid" ON public.aid_requests FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "all_read_symptoms" ON public.symptom_catalog FOR SELECT
USING (true);

-- Politique : Citoyens peuvent créer des signalements
CREATE POLICY "citizen_insert_report" ON public.reports FOR INSERT
WITH CHECK (auth.uid() = citizen_id);

-- Politique : Centres de santé peuvent créer des cas cliniques
CREATE POLICY "center_insert_clinical" ON public.clinical_cases FOR INSERT
WITH CHECK (auth.uid() = facility_id);

-- Politique : Citoyens voient leurs propres signalements
CREATE POLICY "citizen_read_own_reports" ON public.reports FOR SELECT
USING (auth.uid() = citizen_id);

-- Politique : Centres voient leurs propres cas
CREATE POLICY "center_read_own_cases" ON public.clinical_cases FOR SELECT
USING (auth.uid() = facility_id);
