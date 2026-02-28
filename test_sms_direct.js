// Test direct utilisant fetch (comme dans src/lib/sms.ts)
require('dotenv').config({ path: '.env.local' });

async function test() {
    console.log("--- Test Direct HSMS.CI API ---");

    const url = process.env.HSMS_API_URL;
    const token = process.env.HSMS_TOKEN;
    const clientId = process.env.HSMS_CLIENT_ID;
    const clientSecret = process.env.HSMS_CLIENT_SECRET;
    const testNumber = "2250564913501"; // Format 13 chiffres comme dans l'exemple
    const testMessage = "Test Système KENEYA - Notifications HSMS.CI opérationnelles.";

    console.log("URL:", url);
    console.log("Token (4 first chars):", token?.substring(0, 4));

    const params = new URLSearchParams();
    params.append('clientid', clientId);
    params.append('clientsecret', clientSecret);
    params.append('telephone', testNumber);
    params.append('message', testMessage);
    params.append('unicode', 'true');

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
