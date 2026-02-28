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

async function checkSchema() {
    console.log('--- Table: health_centers ---');
    const { data: hc } = await supabase.from('health_centers').select('*').limit(1);
    if (hc && hc.length > 0) console.log(Object.keys(hc[0]));
    else console.log('Table vide ou inaccessible.');

    console.log('\n--- Table: clinical_cases ---');
    const { data: cc } = await supabase.from('clinical_cases').select('*').limit(1);
    if (cc && cc.length > 0) console.log(Object.keys(cc[0]));
    else console.log('Table vide ou inaccessible.');
}

checkSchema();
