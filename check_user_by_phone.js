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

async function checkUser(phone) {
    console.log(`--- Diagnostic for phone: ${phone} ---`);
    const email = `${phone}@keneya.ci`;

    // 1. Check Auth
    const { data: authResult } = await supabase.auth.admin.listUsers();
    const authUser = authResult.users.find(u => u.email === email);

    if (authUser) {
        console.log(`FOUND in Auth: ID=${authUser.id}, Email=${authUser.email}, Confirmed=${authUser.email_confirmed_at ? 'YES' : 'NO'}`);
    } else {
        console.log('NOT FOUND in Auth.');
    }

    // 2. Check DB
    const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

    if (dbUser) {
        console.log(`FOUND in DB: ID=${dbUser.id}, Role=${dbUser.role}, Phone=${dbUser.phone}`);
    } else {
        console.log('NOT FOUND in DB.');
    }
}

const targetPhone = "0101621047";
checkUser(targetPhone);
