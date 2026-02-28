import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Cette route utilise le Service Role Key pour contourner les restrictions
// de création d'utilisateur côté client (qui déconnectent l'admin).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Fallback dangereux mais requis si la clé secrète manque pour le proto

// Initialisation du client admin
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, password, role, language = 'fr' } = body;

        if (!phone || !password) {
            return NextResponse.json({ error: 'Téléphone et mot de passe requis' }, { status: 400 });
        }

        const email = `${phone.replace(/\s+/g, '')}@keneya.ci`;

        // 1. Création de l'utilisateur dans Supabase Auth via l'API Admin
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Valide l'email directement
        });

        if (authError) {
            console.error('Auth Error:', authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const userId = authData.user.id;

        // 2. Insertion du profil dans la table 'users'
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: userId,
                phone: phone,
                role: role || 'citizen',
                language: language
            });

        if (dbError) {
            console.error('DB Insert Error:', dbError);
            // On a créé l'user auth mais foiré l'insert BDD. Idéalement faudrait rollback, mais ignoré pour le proto.
            return NextResponse.json({ error: "Utilisateur créé (Auth) mais échec profil (BDD)" }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: authData.user });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}
