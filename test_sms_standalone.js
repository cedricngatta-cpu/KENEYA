// Test autonome sans dépendances externes
async function test() {
    console.log("--- Test Direct HSMS.CI API (Autonome) ---");

    // Identifiants fournis par l'utilisateur
    const url = "https://hsms.ci/api/envoi-sms/";
    const token = "03f5560a254538b0fa4b1b9c8a00ebb08b3ca3d2";
    const clientId = "OPENSMS_CxgKN6H";
    const clientSecret = "OPENSMS20240925105351.650496uPTVJ4HLwoHOqrJKFSzS";
    const testNumber = "2250564913501";
    const testMessage = "Test Système KENEYA - Notifications HSMS.CI opérationnelles.";

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

        if (response.ok && result.status === "REUSSI") {
            console.log("✅ TEST RÉUSSI : Connexion API et Envoi validés.");
        } else {
            console.log("❌ TEST ÉCHOUÉ : Voir la réponse ci-dessus.");
        }
    } catch (err) {
        console.error("❌ ERREUR FATALE:", err);
    }
}

test();
