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

async function listUsers() {
    console.log('Fetching users from auth.admin... (Need Service Role)');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Auth User Error:', authError.message);
    } else {
        console.log('--- AUTH USERS ---');
        authUsers.users.forEach(u => {
            console.log(`Email: ${u.email} | ID: ${u.id}`);
        });
    }

    console.log('\nFetching profiles from public.users...');
    const { data: profiles, error: profileError } = await supabase.from('users').select('*');

    if (profileError) {
        console.error('Profile Error:', profileError.message);
    } else {
        console.log('--- DB PROFILES ---');
        profiles.forEach(p => {
            console.log(`Phone: ${p.phone} | Role: ${p.role} | ID: ${p.id}`);
        });
    }
}

listUsers();
