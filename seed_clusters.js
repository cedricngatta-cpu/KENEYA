const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Lecture manuelle de .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error('Erreur : Clés Supabase non trouvées dans .env.local');
    process.exit(1);
}

const supabase = createClient(url, key);

async function seedReports() {
    console.log('--- Simulation de 6 cas groupés à Abobo Nord ---');

    const reports = Array.from({ length: 6 }).map(() => ({
        geo_cell: 'Abobo Nord',
        symptoms: ['Choléra'],
        severity: 'rouge',
        created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase.from('reports').insert(reports);

    if (error) {
        console.error('Erreur insertion:', error);
    } else {
        console.log('Succès : 6 signalements insérés.');
    }
}

seedReports();
