const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
    const index = line.indexOf('=');
    if (index > -1) {
        env[line.substring(0, index).trim()] = line.substring(index + 1).trim().replace(/^"|"$/g, '');
    }
});

const url = env.HSMS_API_URL;
const token = env.HSMS_TOKEN;
const clientId = env.HSMS_CLIENT_ID;
const clientSecret = env.HSMS_CLIENT_SECRET;

async function testSMS() {
    let telephone = '0104617601';
    let formattedPhone = telephone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
        formattedPhone = '225' + formattedPhone;
    }

    console.log('--- ENVOI A :', formattedPhone);
    const params = new URLSearchParams();
    params.append('clientid', clientId);
    params.append('clientsecret', clientSecret);
    params.append('telephone', formattedPhone);
    params.append('message', 'Alerte Sante KENEYA: Ceci est un test de debogage direct HSMS.');
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

        const text = await response.text();
        console.log('HTTP STATUS:', response.status);
        console.log('RAW RESPONSE:', text);
    } catch (e) {
        console.error('ERROR:', e);
    }
}

testSMS();
