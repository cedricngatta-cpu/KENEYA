-- Confirmation manuelle des comptes de test
-- À exécuter dans l'éditeur SQL de Supabase

UPDATE auth.users 
SET email_confirmed_at = timezone('utc'::text, now()),
    last_sign_in_at = timezone('utc'::text, now())
WHERE email IN ('0102030405@keneya.ci', '0203040506@keneya.ci');
