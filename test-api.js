const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: body }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function runTest() {
    try {
        console.log('Testing Login...');
        // 账号密码通过环境变量传入（首次启动的随机初始口令见启动日志）；
        // 本仓库已无默认口令，不要把真实口令写进脚本。
        const loginData = JSON.stringify({
            username: process.env.TEST_ADMIN_USER || 'admin',
            password: process.env.TEST_ADMIN_PASS || '',
        });
        const loginRes = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        }, loginData);

        console.log('Login Status:', loginRes.statusCode);
        if (loginRes.statusCode !== 200) {
            console.error('Login Failed:', loginRes.body);
            return;
        }

        const token = JSON.parse(loginRes.body).token;
        console.log('Token received.');

        console.log('\nTesting Get Subscriptions...');
        const subRes = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/subscriptions',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Get Subscriptions Status:', subRes.statusCode);
        console.log('Subscriptions:', subRes.body);

    } catch (error) {
        console.error('Test Error:', error);
    }
}

runTest();
