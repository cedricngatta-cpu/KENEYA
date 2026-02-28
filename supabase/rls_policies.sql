-- Politiques RLS pour permettre aux admins de voir toutes les données
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Politique admin pour la table users (voir tous les utilisateurs)
CREATE POLICY "Les admins peuvent tout voir" 
ON public.users FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. Politique admin pour modifier les utilisateurs
CREATE POLICY "Les admins peuvent modifier les utilisateurs" 
ON public.users FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. Permettre l'insertion pour le trigger de création d'utilisateurs
CREATE POLICY "Insertion pour nouveaux utilisateurs" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4. Activer le trigger pour créer automatiquement le profil lors du signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone, role)
  VALUES (new.id, split_part(new.email, '@', 1), 'citizen');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger (si pas encore actif)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
