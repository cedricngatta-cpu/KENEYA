const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

try {
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

    if (!url || !serviceKey) {
        console.error('ERROR: Missing environment variables');
        process.exit(1);
    }

    const supabase = createClient(url, serviceKey);

    async function checkUsers() {
        console.log('--- Checking `users` table ---');
        const phones = ['0102030405', '0506070809', '01 02 03 04 05', '05 06 07 08 09'];

        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*')
            .in('phone', phones);

        if (usersError) {
            console.error('Error fetching users:', usersError);
        } else {
            console.log('Found in `users` table:');
            console.dir(usersData, { depth: null });
        }

        console.log('\n--- Checking Supabase Auth ---');
        // Requiert auth.admin qui n'est dispo que sur supabase-js backend
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error('Error fetching auth users:', authError);
        } else {
            console.log('Total auth users:', authData.users.length);
            const targets = authData.users.filter(u =>
                u.email && (u.email.includes('0102030405') || u.email.includes('0506070809') || u.email.includes('01 02 03 04 05'))
            );
            console.log('Target auth users found:');
            targets.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}, CreatedAt: ${u.created_at}`));
            if (targets.length === 0) console.log('Aucun utilisateur trouvé dans Auth.');
        }
    }

    checkUsers();
} catch (err) {
    console.error('Script Error:', err);
}
