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

async function syncHCUser() {
    const phone = '0707070707';
    const email = `${phone}@keneya.ci`;
    const role = 'health_center';

    console.log(`Syncing user ${email}...`);

    // 1. Lister tous les utilisateurs Auth pour trouver l'ID
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Auth List Error:', authError.message);
        return;
    }

    const user = authUsers.users.find(u => u.email === email);

    if (!user) {
        console.log('User not found, creating...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password: 'password123',
            email_confirm: true
        });
        if (createError) {
            console.error('Create Error:', createError.message);
            return;
        }
        await updateProfile(newUser.user.id, phone, role);
    } else {
        console.log('User found:', user.id);
        await updateProfile(user.id, phone, role);
    }
}

async function updateProfile(userId, phone, role) {
    const { error: dbError } = await supabase
        .from('users')
        .upsert({
            id: userId,
            phone: phone,
            role: role,
            language: 'fr'
        });

    if (dbError) {
        console.error('DB Error:', dbError.message);
    } else {
        console.log(`SUCCESS: Profile for ${phone} updated with role ${role}`);
    }
}

syncHCUser();
