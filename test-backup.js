const axios = require('axios');
const fs = require('fs');

async function testBackup() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
            username: 'admin',
            password: 'admin'
        });
        const token = loginRes.data.token;
        console.log('Login successful, token:', token);

        // 2. Download Backup
        const backupRes = await axios.get('http://localhost:8080/api/settings/backup', {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer'
        });

        if (backupRes.status === 200 && backupRes.data.length > 0) {
            console.log('Backup download successful. Size:', backupRes.data.length);
            fs.writeFileSync('downloaded_test.db', backupRes.data);
            console.log('Saved to downloaded_test.db');
        } else {
            console.error('Backup failed:', backupRes.status);
        }

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testBackup();
