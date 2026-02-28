-- Initialisation de la table users avec Roles (RBAC)
-- Note : Ce script doit être exécuté dans l'éditeur SQL de Supabase

-- 1. S'assurer que la table users existe (base sur src/types/supabase.ts)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role TEXT CHECK (role IN ('citizen', 'community_agent', 'health_center', 'district', 'city_hall', 'admin')) DEFAULT 'citizen',
    phone TEXT,
    language TEXT DEFAULT 'fr',
    org_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Politiques RLS de base
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- 2. Procédure pour créer des utilisateurs de test facilement
-- Note : Dans Supabase, l'auth est gérée par auth.users, ici on prépare les profils liés

-- COMPTE ADMIN (Exemple : 0102030405)
-- Email simulé : 0102030405@keneya.ci
-- Rôle : admin

-- COMPTE CENTRE DE SANTÉ (Exemple : 0203040506)
-- Email simulé : 0203040506@keneya.ci
-- Rôle : health_center

-- COMPTE AGENT COMMUNAUTAIRE (Exemple : 0304050607)
-- Email simulé : 0304050607@keneya.ci
-- Rôle : community_agent

-- 3. Trigger pour créer automatiquement l'entrée dans public.users lors d'un Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone, role)
  VALUES (new.id, split_part(new.email, '@', 1), 'citizen');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Décommenter pour activer le trigger automatique
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
