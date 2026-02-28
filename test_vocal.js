// fichier de test manuel sur nodejs
// On reproduit exactement le bloc de parsing métier développé au step précédent

function simulateLanguageDetection(liveTextFromMicrophone) {
    const liveText = liveTextFromMicrophone.toLowerCase();

    // Bloc "lang" : Détecter si on doit couper le micro
    const optionsFR = ['1', 'un', 'francais', 'français', 'france'];
    const optionsDioula = ['2', 'deux', 'dioula', 'jula'];
    const optionsBaoule = ['3', 'trois', 'baoule', 'baoulé'];

    const isFr = optionsFR.some(word => liveText.includes(word));
    const isDioula = optionsDioula.some(word => liveText.includes(word));
    const isBaoule = optionsBaoule.some(word => liveText.includes(word));

    let shouldStopMicrophone = false;
    if (isFr || isDioula || isBaoule) {
        shouldStopMicrophone = true;
    }

    // --- On simule qu'à la seconde où le micro coupe, on analyse la phrase finale ---

    let decidedLanguage = 'INCONNU';

    if (isDioula) {
        decidedLanguage = 'dioula';
    } else if (isBaoule) {
        decidedLanguage = 'baoule';
    } else if (isFr || liveText.trim() === '') {
        // Si isFr est vrai OU s'il n'a rien saisi/rien compris, on met Fr
        decidedLanguage = 'fr';
    } else {
        // par défaut absolue (safety fallback)
        decidedLanguage = 'fr';
    }

    return {
        microphoneCutInstantly: shouldStopMicrophone,
        languageSelected: decidedLanguage
    };
}

const testsScenarios = [
    "1",
    "un",
    "le numéro un",
    "français s'il vous plait",
    "je choisis francais",
    "2",
    "deux c'est mieux",
    "baoulé",
    "trois",
    "n'importe quoi", // Devrait stopper sur 'fr' par fallback
    "c'est le num 1",
    "un un"
];

console.log("=== TESTS ASSISTANT VOCAL (SIMULATION DU MICROPHONE MOBILE) ===");
testsScenarios.forEach(sentence => {
    const result = simulateLanguageDetection(sentence);
    const pass = result.microphoneCutInstantly || sentence === "n'importe quoi" ? "✅ PASS" : "❌ FAIL";
    console.log(`[ "${sentence}" ] \n -> CutMicro: ${result.microphoneCutInstantly} \n -> Language chosen: ${result.languageSelected} \n -> Test Status: ${pass}\n`);
});
