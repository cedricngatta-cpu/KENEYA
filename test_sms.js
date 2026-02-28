const { sendSMS } = require('../src/lib/sms');
require('dotenv').config({ path: '.env.local' });

async function test() {
    console.log("--- Test Envoi SMS ---");
    const testNumber = "0564913501"; // Numéro de test
    const testMessage = "Test Système KENEYA - Intégration HSMS.CI réussie.";

    const result = await sendSMS(testNumber, testMessage);
    console.log("Résultat:", JSON.stringify(result, null, 2));
}

test();
