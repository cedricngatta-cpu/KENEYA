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

async function check() {
    const { data: reports } = await supabase.from('reports').select('id, geo_cell, symptoms').eq('geo_cell', 'Abobo Nord');
    console.log('--- REPORTS (Abobo Nord) ---');
    console.log('Count:', reports ? reports.length : 0);
    console.log('Details:', JSON.stringify(reports, null, 2));

    const { data: cl } = await supabase.from('clusters').select('*');
    console.log('\n--- ALL CLUSTERS ---');
    console.log(JSON.stringify(cl, null, 2));
}

check();
