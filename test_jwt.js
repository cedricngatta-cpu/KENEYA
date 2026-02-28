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

    let out = '';

    const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) {
        const parts = anonKey.split('.');
        if (parts.length === 3) {
            const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
            out += '--- ANON KEY JWT PAYLOAD ---\n';
            out += decoded + '\n';
        } else {
            out += 'Invalid JWT format for ANON\n';
        }
    } else {
        out += 'No Anon Key\n';
    }

    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
        const parts = serviceKey.split('.');
        if (parts.length === 3) {
            const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
            out += '--- SERVICE ROLE KEY JWT PAYLOAD ---\n';
            out += decoded + '\n';
        }
    }

    fs.writeFileSync('jwt_out_utf8.txt', out, 'utf8');
    console.log('Saved to jwt_out_utf8.txt');

} catch (err) {
    console.error('Script Error:', err);
}
