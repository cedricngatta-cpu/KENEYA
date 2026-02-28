import { NextResponse } from 'next/server';
import { OfficialDataService } from '@/services/OfficialDataService';

// Type attendu du Frontend
interface TriageRequest {
    transcript: string; // Ce que l'utilisateur a dit (ex: "J'ai mal à la tête et je vomis du sang")
    language?: string;  // Langue détectée ou choisie (ex: "fr-FR" ou "dioula")
}

interface TriageResponse {
    diagnosis: 'safe' | 'warning' | 'danger'; // Vert, Jaune, Rouge
    syndrome: 'digestif' | 'moustiques' | 'hemorragique' | 'respiratoire' | 'neurologique' | 'rash' | 'unknown';
    suspectedIllness: string;
    confidence: number;
    reasoning: string;
    instructions: string[];
    targetHospital?: string;
    officialAlertMatch?: any; // Information sur une alerte officielle correspondante
}

export async function POST(req: Request) {
    try {
        const body: TriageRequest = await req.json();
        const text = body.transcript.toLowerCase();

        // 1. Detection du syndrome et de la gravité selon les mots-clés
        let syndrome: TriageResponse['syndrome'] = 'unknown';
        let diagnosis: TriageResponse['diagnosis'] = 'safe';
        let illness = "Non déterminé";
        let reasoning = "";
        let instructions: string[] = ["Reposez-vous et buvez de l'eau."];
        let hospital = undefined;

        // A. Syndrome Digestif
        if (text.includes('diarrhée') || text.includes('vomissement') || text.includes('déshydratation')) {
            syndrome = 'digestif';
            if (text.includes('riz') || text.includes('abondante') || text.includes('soif')) {
                diagnosis = 'danger';
                illness = "Choléra Suspect";
                reasoning = "Présence de diarrhée aqueuse profuse avec risque de déshydratation rapide.";
                instructions = ["Buvez immédiatement de la solution de réhydratation orale (SRO)", "Rendez-vous aux urgences immédiatement."];
                hospital = "Centre de Traitement du Choléra (CTC) le plus proche";
            } else {
                diagnosis = 'warning';
                illness = "Typhoïde ou Gastro-entérite";
                instructions = ["Consultez un centre de santé dans les 24h", "Continuez à vous hydrater."];
            }
        }
        // E. Syndrome Neurologique (Prioritaire sur le reste car URGENCE systématique)
        else if (text.includes('nuque') || text.includes('confusion') || text.includes('convulsion') || text.includes('photophobie')) {
            syndrome = 'neurologique';
            diagnosis = 'danger';
            illness = "Méningite Suspecte";
            reasoning = "Signes neurologiques graves associés à une forte fièvre.";
            instructions = ["URGENCE ABSOLUE : Appelez une ambulance", "Ne restez pas seul."];
            hospital = "CHU (Service Neurologie/Urgences)";
        }
        // C. Syndrome Hémorragique
        else if (text.includes('jaunisse') || text.includes('jaune') || text.includes('saigne') || text.includes('sang')) {
            syndrome = 'hemorragique';
            diagnosis = 'danger';
            illness = "Fièvre Hémorragique ou Fièvre Jaune";
            reasoning = "Présence de jaunisse ou de saignements anormaux avec fièvre.";
            instructions = ["Isolement immédiat", "Transfert urgent vers une unité spécialisée."];
            hospital = "CHU de Treichville (Maladies Infectieuses)";
        }
        // B. Syndrome Moustiques
        else if (text.includes('moustique') || text.includes('dengue') || text.includes('palu') || text.includes('yeux') || text.includes('articulation')) {
            syndrome = 'moustiques';
            if (text.includes('rash') || text.includes('éruption') || text.includes('saignement')) {
                diagnosis = 'danger';
                illness = "Dengue Sévère";
                instructions = ["Consultez en urgence", "Pas d'aspirine avant diagnostic."];
            } else {
                diagnosis = 'warning';
                illness = "Paludisme ou Dengue simple";
                instructions = ["Faites un test de diagnostic rapide (TDR)", "Consultez un infirmier."];
            }
        }
        // D. Syndrome Respiratoire
        else if (text.includes('toux') || text.includes('respirer') || text.includes('souffle') || text.includes('coeur') || text.includes('poitrine')) {
            syndrome = 'respiratoire';
            if (text.includes('étouffe') || text.includes('mal à respirer') || text.includes('douleur poitrine')) {
                diagnosis = 'danger';
                illness = "Détresse Respiratoire (COVID Sévère/Pneumonie)";
                instructions = ["Oxygène requis", "Rendez-vous aux urgences."];
                hospital = "SAMU / Urgences Respiratoires";
            } else {
                diagnosis = 'warning';
                illness = "Infection Respiratoire (COVID/Grippe)";
                instructions = ["Isolez-vous", "Portez un masque", "Surveillez votre respiration."];
            }
        }
        // F. Syndrome Rash
        else if (text.includes('bouton') || text.includes('éruption') || text.includes('peau') || text.includes('rash')) {
            syndrome = 'rash';
            if (text.includes('ganglion') || text.includes('douloureux')) {
                illness = "Mpox (Variole Simienne)";
                diagnosis = 'warning';
                instructions = ["Évitez tout contact peau-à-peau", "Isolément strict."];
            } else if (text.includes('yeux rouges') || text.includes('rhume')) {
                illness = "Rougeole";
                diagnosis = 'warning';
                instructions = ["Alerte vaccination requise", "Isolez les enfants."];
            } else {
                diagnosis = 'warning';
                illness = "Éruption suspecte";
            }
        }

        // 2. Comparaison avec les sources officielles (MSHPCMU / INHP)
        const zoneSimulee = "Abidjan"; // En production, utiliser la géolocalisation
        const officialMatch = await OfficialDataService.checkAlertMatch(illness, zoneSimulee);

        let confidence = 0.90;
        if (officialMatch) {
            confidence = 0.98; // On augmente la confiance car le ministère signale déjà cela
            reasoning += ` MATCH OFFICIEL : Cette zone est sous alerte ${officialMatch.source} pour ${officialMatch.disease}.`;
        }

        const mockResponse: TriageResponse = {
            diagnosis,
            syndrome,
            suspectedIllness: illness,
            confidence,
            reasoning: reasoning || `Classification basée sur les symptômes : ${syndrome}.`,
            instructions,
            targetHospital: hospital,
            officialAlertMatch: officialMatch
        };

        // Délai simulé
        await new Promise(resolve => setTimeout(resolve, 1500));

        return NextResponse.json(mockResponse);

    } catch (error) {
        console.error("Erreur Triage API:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'analyse IA du symptôme." },
            { status: 500 }
        );
    }
}
