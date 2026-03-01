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

async function repairUser() {
    const phone = "0101621047";
    const role = "health_center";
    const password = "password123";
    const email = `${phone}@keneya.ci`;

    console.log(`--- Repairing user: ${phone} ---`);

    // 1. Find or create in Auth
    const { data: authResult } = await supabase.auth.admin.listUsers();
    let authUser = authResult.users.find(u => u.email === email);

    if (authUser) {
        console.log(`Found in Auth (ID: ${authUser.id}). Updating password...`);
        await supabase.auth.admin.updateUserById(authUser.id, {
            password: password,
            email_confirm: true
        });
    } else {
        console.log(`Not found in Auth. Creating...`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });
        if (createError) {
            console.error('Error creating user:', createError.message);
            return;
        }
        authUser = newUser.user;
    }

    // 2. Upsert in DB
    console.log(`Upserting profile in DB with role: ${role}...`);
    const { error: dbError } = await supabase.from('users').upsert({
        id: authUser.id,
        phone: phone,
        role: role,
        language: 'fr'
    });

    if (dbError) {
        console.error('DB Error:', dbError.message);
    } else {
        console.log('SUCCESS: User is repaired and can now login.');
        console.log(`Phone: ${phone}`);
        console.log(`Password: ${password}`);
    }
}

repairUser();
