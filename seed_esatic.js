const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://eftvwdblkisbrehdumua.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmdHZ3ZGJsa2lzYnJlaGR1bXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTU1OTksImV4cCI6MjA4Nzc5MTU5OX0.S_b8aI9vPGdGeUPFhOUTKLAMsf9ytM0e1tHG8mB1zaw";

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const reports = [
    {
        patient_name: "Kouadio Jean",
        patient_phone: "0708091011",
        symptoms: ["fievre", "sang"],
        symptoms_text: "Je vomis du sang et j'ai une forte fièvre depuis hier soir.",
        severity: "rouge",
        suspected_illness: "Fièvre Hémorragique Virale (Ebola/Marburg)",
        geo_cell: "ESATIC",
        metadata: { lat: 5.3023, lng: -4.0042, source: "vocal_demo" }
    },
    {
        patient_name: "Traoré Aminata",
        patient_phone: "0102030405",
        symptoms: ["fievre", "maux de tete"],
        symptoms_text: "J'ai très mal à la tête et je suis brûlante de fièvre.",
        severity: "jaune",
        suspected_illness: "Diagnostic Suspect",
        geo_cell: "ESATIC",
        metadata: { lat: 5.3025, lng: -4.0040, source: "vocal_demo" }
    },
    {
        patient_name: "Yao Koffi",
        patient_phone: "0506070809",
        symptoms: ["sang", "douleur"],
        symptoms_text: "Mon fils saigne du nez et se plaint de fortes douleurs.",
        severity: "rouge",
        suspected_illness: "Fièvre Hémorragique Virale (Ebola/Marburg)",
        geo_cell: "ESATIC",
        metadata: { lat: 5.3021, lng: -4.0045, source: "vocal_demo" }
    }
];

async function seedReports() {
    console.log("Seeding ESATIC reports...");
    const { data, error } = await supabase.from('reports').insert(reports);
    if (error) console.error("Error seeding:", error);
    else console.log("Seeded successfully:", reports.length, "reports.");

    // Déclenchement de la détection de cluster (IA)
    console.log("Simulating cluster detection for ESATIC...");
    const { data: cluster, error: clusterError } = await supabase.from('clusters').insert({
        name: "Cluster Critique ESATIC (Treichville)",
        disease: "Fièvre Hémorragique Virale",
        zone: "ESATIC",
        severity: "rouge",
        reports_count: 3,
        status: "active",
        description: "Multiples cas de saignements et fièvres détectés dans la zone ESATIC."
    });

    if (clusterError) console.error("Error seeding cluster:", clusterError);
    else console.log("Cluster ESATIC created successfully.");
}

seedReports();
