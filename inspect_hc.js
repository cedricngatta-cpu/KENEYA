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

async function checkHC() {
    const { data, error } = await supabase.from('health_centers').select('*').limit(0);
    if (error) {
        console.error('Error:', error.message);
    } else {
        // Si la table est vide, PostgREST ne renvoie pas les colonnes comme ça.
        // Mais on peut essayer de deviner via une insertion annulée ou RPC.
        // Ici on va juste lister ce qu'on a.
        console.log('Columns HC:', Object.keys(data[0] || {}));
    }
}

checkHC();
