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
    const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    let out = '--- START GLOBAL DIAGNOSTIC ---\n';
    out += 'URL: ' + url + '\n';

    async function testKey(name, key) {
        out += `\nTesting ${name}...\n`;
        if (!key) {
            out += `FAIL: ${name} is missing.\n`;
            return;
        }
        const supabase = createClient(url, key);
        const { data, error } = await supabase.from('reports').select('id').limit(1);
        if (error) {
            out += `FAIL: ${name} error - ${error.message}\n`;
            if (error.hint) out += `Hint: ${error.hint}\n`;
            if (error.code) out += `Code: ${error.code}\n`;
        } else {
            out += `SUCCESS: ${name} is valid.\n`;
        }
    }

    async function run() {
        await testKey('ANON_KEY', anonKey);
        await testKey('SERVICE_ROLE_KEY', serviceKey);

        fs.writeFileSync('diagnostic_results.txt', out, 'utf8');
        console.log('Done, results in diagnostic_results.txt');
    }

    run();
} catch (err) {
    fs.writeFileSync('diagnostic_results.txt', 'Script Error: ' + err.message, 'utf8');
}
