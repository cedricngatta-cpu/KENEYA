-- Table des diffusions d'alertes sanitaires
CREATE TABLE IF NOT EXISTS broadcasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel TEXT NOT NULL CHECK (channel IN ('sms', 'telegram', 'voice')),
    zone TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON broadcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcasts_zone ON broadcasts(zone);

-- RLS
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs authentifiés peuvent voir les broadcasts
CREATE POLICY "Authenticated users can read broadcasts"
    ON broadcasts FOR SELECT
    TO authenticated
    USING (true);

-- Les utilisateurs authentifiés peuvent créer des broadcasts
CREATE POLICY "Authenticated users can create broadcasts"
    ON broadcasts FOR INSERT
    TO authenticated
    WITH CHECK (true);
