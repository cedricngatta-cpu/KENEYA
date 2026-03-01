const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateAdmin() {
    const newPhone = "0556468126";
    const oldAdminId = "46c153ac-5670-4269-9ee9-edbd82b9ee95";
    const newEmail = `${newPhone}@keneya.ci`;
    const defaultPassword = "KeneyaAdmin2026!";

    console.log(`Starting migration for Super Admin to ${newPhone}...`);

    // 1. Check if new user already exists in Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    let newUser = users.find(u => u.email === newEmail);
    let newUserId;

    if (!newUser) {
        console.log("Creating new user in Auth...");
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: newEmail,
            password: defaultPassword,
            email_confirm: true
        });

        if (authError) {
            console.error('Error creating user in Auth:', authError);
            return;
        }
        newUserId = authData.user.id;
        console.log(`User created with ID: ${newUserId}`);
    } else {
        newUserId = newUser.id;
        console.log(`User already exists in Auth with ID: ${newUserId}`);
    }

    // 2. Create/Update profile in 'users' table
    console.log("Updating profile in 'users' table...");
    const { error: upsertError } = await supabase
        .from('users')
        .upsert({
            id: newUserId,
            phone: newPhone,
            role: 'admin',
            language: 'fr'
        });

    if (upsertError) {
        console.error('Error upserting profile:', upsertError);
        return;
    }

    // 3. Delete old admin
    console.log(`Deleting old admin (${oldAdminId})...`);

    // Delete from profiles first (due to FK if any)
    const { error: deleteDbError } = await supabase
        .from('users')
        .delete()
        .eq('id', oldAdminId);

    if (deleteDbError) {
        console.warn('Warning: Could not delete old profile from DB:', deleteDbError);
    }

    // Delete from Auth
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(oldAdminId);
    if (deleteAuthError) {
        console.error('Error deleting old user from Auth:', deleteAuthError);
    } else {
        console.log("Old admin deleted successfully.");
    }

    console.log("Migration completed successfully!");
    console.log(`New Admin: ${newPhone}`);
    console.log(`Password: ${defaultPassword}`);
}

migrateAdmin();
