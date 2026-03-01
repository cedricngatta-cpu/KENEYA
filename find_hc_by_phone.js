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

async function findHC(phone) {
    const { data, error } = await supabase
        .from('health_centers')
        .select('*')
        .or(`primary_contact.eq.${phone},secondary_contact.eq.${phone}`);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Result:', JSON.stringify(data, null, 2));
    }
}

findHC("0101621047");
