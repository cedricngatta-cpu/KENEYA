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

async function listTables() {
    // On peut essayer de faire une requête bidon sur des tables communes ou via information_schema si possible
    console.log('--- Verification des tables probables ---');
    const tables = ['users', 'reports', 'diseases', 'system_config', 'clusters', 'clinical_cases', 'health_centers', 'centers', 'hopitaux'];

    for (const t of tables) {
        const { error } = await supabase.from(t).select('id').limit(0);
        console.log(`Table '${t}':`, error ? `NON (${error.message})` : 'OUI');
    }
}

listTables();
