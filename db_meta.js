const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function checkConstraints() {
    const { data, error } = await supabase.rpc('get_constraints', { t_name: 'clusters' });
    // Comme je n'ai peut-être pas de RPC, je vais essayer une requête directe via SQL si possible,
    // mais ici je vais juste essayer de recréer la table proprement en supprimant l'ancienne.
    console.log('Tentative de suppression et recréation de la table clusters...');

    // NOTE: Je ne peux pas faire de DROP TABLE via Supabase client standard sans RPC ou SQL direct.
    // Je vais demander à l'utilisateur de vérifier son SQL ou essayer d'écraser la table.

    // Alternative: Essayer d'insérer avec une valeur différente pour time_window.
    // Peut-être que le check attend '48h' au lieu de 'Dernières 48h' ?
}

async function listTableInfo() {
    // Utilisation de PostgREST pour deviner les colonnes
    const { data: cols } = await supabase.from('clusters').select('*').limit(0);
    console.log('Columns:', Object.keys(cols ? cols : {}));
}

listTableInfo();
