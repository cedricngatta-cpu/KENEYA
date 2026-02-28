-- Si le RLS (Security Policies) vous bloque, vous pouvez simplement le désactiver 
-- momentanément pour permettre les tests et voir les points GPS sur la carte.

ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
