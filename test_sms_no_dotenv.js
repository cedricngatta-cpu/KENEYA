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

async function test() {
    console.log("--- Test Direct HSMS.CI API (No Dotenv) ---");

    const url = env.HSMS_API_URL;
    const token = env.HSMS_TOKEN;
    const clientId = env.HSMS_CLIENT_ID;
    const clientSecret = env.HSMS_CLIENT_SECRET;
    const testNumber = "2250556468126";
    const testMessage = "INFO KENEYA : Ceci est un test d'alerte officiel. Le système de notification de la ville d'Abidjan est maintenant opérationnel. Merci.";

    if (!url || !token || !clientId || !clientSecret) {
        console.error("Missing config!");
        return;
    }

    console.log("URL:", url);
    console.log("Token (4 first chars):", token?.substring(0, 4));

    const params = new URLSearchParams();
    params.append('clientid', clientId);
    params.append('clientsecret', clientSecret);
    params.append('telephone', testNumber);
    params.append('message', testMessage);
    params.append('unicode', 'true');
    params.append('sender_id', 'KENEYA');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: params.toString(),
        });

        const result = await response.json();
        console.log("Status:", response.status);
        console.log("Réponse:", JSON.stringify(result, null, 2));

        if (response.ok) {
            console.log("✅ TEST RÉUSSI : Connexion API établie.");
        } else {
            console.log("❌ TEST ÉCHOUÉ : Erreur API.");
        }
    } catch (err) {
        console.error("❌ ERREUR FATALE:", err);
    }
}

test();
