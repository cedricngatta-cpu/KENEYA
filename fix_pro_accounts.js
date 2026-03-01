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

async function fixAccounts() {
    const accounts = [
        { phone: '0102030405', password: 'admin123', role: 'admin' },
        { phone: '0707070707', password: 'password123', role: 'health_center' }
    ];

    for (const acc of accounts) {
        const email = `${acc.phone}@keneya.ci`;
        console.log(`\n--- Processing account: ${acc.phone} (${acc.role}) ---`);

        // 1. Check if user exists in Auth
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        let user = authUsers.users.find(u => u.email === email);

        if (user) {
            console.log(`User found in Auth (ID: ${user.id}). Updating password and confirming email...`);
            const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
                password: acc.password,
                email_confirm: true
            });
            if (updateError) console.error('Update Error:', updateError.message);
        } else {
            console.log(`User NOT found in Auth. Creating...`);
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email,
                password: acc.password,
                email_confirm: true
            });
            if (createError) {
                console.error('Create Error:', createError.message);
                continue;
            }
            user = newUser.user;
            console.log(`User created (ID: ${user.id})`);
        }

        // 2. Ensure profile exists in 'users' table
        console.log(`Updating profile in DB...`);
        const { error: dbError } = await supabase.from('users').upsert({
            id: user.id,
            phone: acc.phone,
            role: acc.role,
            language: 'fr'
        }, { onConflict: 'id' });

        if (dbError) console.error('DB Error:', dbError.message);
        else console.log(`SUCCESS: ${acc.phone} is now ready.`);
    }
}

fixAccounts();
