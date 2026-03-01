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

async function createHCUser() {
    const phone = '0707070707';
    const password = 'password123';
    const email = `${phone}@keneya.ci`;
    const role = 'health_center';

    console.log(`Creating user ${email}...`);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authError) {
        if (authError.message.includes('already registered')) {
            console.log('User already exists in Auth, updating profile...');
            // On continue pour s'assurer que le profil est correct
            const { data: existingUser } = await supabase.auth.admin.listUsers();
            const user = existingUser.users.find(u => u.email === email);
            if (user) {
                await updateProfile(user.id, phone, role);
            }
        } else {
            console.error('Auth Error:', authError.message);
        }
    } else {
        console.log('User created in Auth successfully:', authData.user.id);
        await updateProfile(authData.user.id, phone, role);
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
        console.log(`Profile updated for ${phone} with role ${role}`);
    }
}

createHCUser();
