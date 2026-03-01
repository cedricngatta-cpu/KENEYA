const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
    const index = line.indexOf('=');
    if (index > -1) {
        const key = line.substring(0, index).trim();
        const value = line.substring(index + 1).trim().replace(/^"|"$/g, '');
        env[key] = value;
    }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, serviceKey);

async function checkBroadcasts() {
    console.log('Checking table: broadcasts');
    const { data, error, count } = await supabase
        .from('broadcasts')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error:', error.message);
        if (error.message.includes('relation "public.broadcasts" does not exist')) {
            console.log('CRITICAL: Table "broadcasts" is missing!');
        }
    } else {
        console.log(`Table exists. Row count: ${count}`);

        // Check columns
        const { data: sample } = await supabase.from('broadcasts').select('*').limit(1);
        if (sample && sample.length > 0) {
            console.log('Columns:', Object.keys(sample[0]));
        } else {
            console.log('Table is empty, cannot easily list columns via select.');
        }
    }
}

checkBroadcasts();
