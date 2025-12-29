console.log('Starting application...');
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, p) => {
    console.error('UNHANDLED REJECTION:', reason);
    process.exit(1);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
// Zeabur uses WEB_PORT, other platforms use PORT
const PORT = process.env.WEB_PORT || process.env.PORT || 3001;

try {
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Loading modules...');

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Routes
    console.log('Loading routes...');
    const authRoutes = require('./routes/auth');
    const subscriptionRoutes = require('./routes/subscriptions');
    const settingsRoutes = require('./routes/settings');

    app.use('/api/auth', authRoutes);
    app.use('/api/subscriptions', subscriptionRoutes);
    app.use('/api/settings', settingsRoutes);

    // API Routes Placeholder
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', message: 'LaoWang Subscription API is running', version: '1.5.0' });
    });

    // ========== 外部触发 API（使用 API Token 认证，不需要 JWT） ==========
    app.post('/api/notify/:token', (req, res) => {
        const { token } = req.params;
        const db = require('./db');
        const { checkSubscriptions, checkAutoRenew } = require('./cron/checker');

        // 验证 API Token
        db.get('SELECT value FROM settings WHERE key = "api_token"', [], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            const storedToken = row?.value;
            if (!storedToken) {
                return res.status(403).json({ error: 'API Token 未配置，请在设置中配置' });
            }

            if (token !== storedToken) {
                return res.status(401).json({ error: 'Invalid API Token' });
            }

            // Token 验证通过，触发检查
            console.log('External trigger: Running subscription check via API Token');
            checkSubscriptions();
            checkAutoRenew();

            res.json({
                success: true,
                message: '订阅检查已触发',
                timestamp: new Date().toISOString()
            });
        });
    });

    // GET 方式也支持（方便 Cloudflare Workers 的简单触发）
    app.get('/api/notify/:token', (req, res) => {
        const { token } = req.params;
        const db = require('./db');
        const { checkSubscriptions, checkAutoRenew } = require('./cron/checker');

        db.get('SELECT value FROM settings WHERE key = "api_token"', [], (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            const storedToken = row?.value;
            if (!storedToken || token !== storedToken) {
                return res.status(401).json({ error: 'Invalid or missing API Token' });
            }

            console.log('External trigger (GET): Running subscription check');
            checkSubscriptions();
            checkAutoRenew();
            res.json({ success: true, message: '检查已触发', timestamp: new Date().toISOString() });
        });
    });

    // Serve frontend in production
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(path.join(__dirname, '../dist')));
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../dist/index.html'));
        });
    }

    console.log('Loading cron jobs...');
    const { startCronJob } = require('./cron/checker');
    startCronJob();

    console.log(`Attempting to bind port ${PORT}...`);
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });

} catch (err) {
    console.error('FATAL ERROR DURING STARTUP:', err);
    console.error(err.stack);
    process.exit(1);
}
