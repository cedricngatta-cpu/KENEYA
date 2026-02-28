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
    const { error: err1 } = await supabase.from('health_centers').select('id', { count: 'exact', head: true });
    console.log('HEALTH_CENTERS_EXIST:', !err1);
    if (err1) console.log('Err HC:', err1.message);

    const { error: err2 } = await supabase.from('clinical_cases').select('id', { count: 'exact', head: true });
    console.log('CLINICAL_CASES_EXIST:', !err2);
    if (err2) console.log('Err CC:', err2.message);
}

check();
