-- Réparation des profils utilisateurs
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Insérer les profils manquants dans public.users pour les comptes de test
INSERT INTO public.users (id, role, phone)
SELECT id, 
       CASE 
         WHEN email = '0102030405@keneya.ci' THEN 'admin'
         WHEN email = '0203040506@keneya.ci' THEN 'health_center'
         ELSE 'citizen'
       END as role,
       split_part(email, '@', 1) as phone
FROM auth.users
WHERE email IN ('0102030405@keneya.ci', '0203040506@keneya.ci')
ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, 
    phone = EXCLUDED.phone;
