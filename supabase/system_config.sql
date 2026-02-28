-- =============================================
-- KENEYA - Table Configuration Système
-- Stocke les paramètres de la plateforme
-- =============================================

CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insérer les paramètres par défaut
INSERT INTO system_config (key, value) VALUES
    ('alert_threshold', '5'),
    ('ai_confidence_threshold', '85'),
    ('human_moderation', 'true'),
    ('auto_validation_critical', 'true'),
    ('whatsapp_notifications', 'true'),
    ('double_auth', 'false')
ON CONFLICT (key) DO NOTHING;

-- RLS : lecture et écriture pour les admins uniquement
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_config" ON system_config;
CREATE POLICY "admin_read_config" ON system_config
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

DROP POLICY IF EXISTS "admin_update_config" ON system_config;
CREATE POLICY "admin_update_config" ON system_config
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

DROP POLICY IF EXISTS "admin_insert_config" ON system_config;
CREATE POLICY "admin_insert_config" ON system_config
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );
