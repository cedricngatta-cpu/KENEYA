const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function debugClustering() {
    console.log('--- Debug Moteur Clustering ---');

    // 1. Threshold
    const { data: configData } = await supabase.from('system_config').select('value').eq('key', 'alert_threshold').single();
    const threshold = configData ? parseInt(configData.value) : 5;
    console.log('Threshold:', threshold);

    // 2. Fetch reports
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    console.log('Time limit:', fortyEightHoursAgo);

    const { data: reports, error } = await supabase.from('reports').select('geo_cell, symptoms, created_at').gte('created_at', fortyEightHoursAgo);

    if (error) { console.error('Error fetching reports:', error); return; }
    console.log('Reports found:', reports ? reports.length : 0);

    const clustersMap = {};
    reports.forEach(report => {
        const zone = report.geo_cell || 'Inconnue';
        const symptoms = Array.isArray(report.symptoms) ? report.symptoms : [report.symptoms];
        if (!clustersMap[zone]) clustersMap[zone] = {};
        symptoms.forEach(s => {
            if (typeof s === 'string') {
                clustersMap[zone][s] = (clustersMap[zone][s] || 0) + 1;
            }
        });
    });

    console.log('Clusters Map:', JSON.stringify(clustersMap, null, 2));

    for (const [zone, syndromes] of Object.entries(clustersMap)) {
        for (const [syndrome, count] of Object.entries(syndromes)) {
            if (count >= threshold) {
                console.log(`Bingo! Cluster detected: ${zone} - ${syndrome} (Count: ${count})`);
                const { data: existing } = await supabase.from('clusters').select('id').eq('geo_cell', zone).eq('syndrome', syndrome).eq('status', 'active').single();
                if (existing) {
                    console.log('Updating existing cluster:', existing.id);
                } else {
                    console.log('Creating new cluster...');
                    const { error: insError } = await supabase.from('clusters').insert({
                        geo_cell: zone,
                        syndrome: syndrome,
                        score: count,
                        status: 'active',
                        time_window: 'Dernières 48h'
                    });
                    if (insError) console.error('Insert Error:', insError);
                    else console.log('Cluster created successfully.');
                }
            }
        }
    }
}

debugClustering();
