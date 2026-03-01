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

async function checkHistory() {
    console.log('--- SMS BROADCAST HISTORY ---');
    const { data: history, error } = await supabase
        .from('broadcasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error.message);
    } else {
        history.forEach((h, i) => {
            console.log(`[${i + 1}] Channel: ${h.channel} | Zone: ${h.zone} | Created: ${h.created_at}`);
            console.log(`Message: "${h.message.substring(0, 50)}..."`);
            console.log('---');
        });
    }
}

checkHistory();
