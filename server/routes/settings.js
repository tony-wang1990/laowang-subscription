const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to check auth (reuse from index or centralize, for now assumes index passes it or we re-implement)
// Note: In index.js we didn't globally apply auth to all routes with a single middleware, 
// we applied it per route file or in index.js. 
// Let's look at index.js: app.use('/api/subscriptions', subscriptionRoutes);
// And subscriptionRoutes has `router.use(authenticate)`.
// So we should do the same here.

const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const jwt = require('jsonwebtoken');
    const SECRET_KEY = process.env.JWT_SECRET || 'laowang-secret-key';

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.userId = decoded.id;
        next();
    });
};

router.use(authenticate);

// Get all settings
router.get('/', (req, res) => {
    db.all('SELECT * FROM settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json(settings);
    });
});

// Update settings (bulk or single)
router.post('/', (req, res) => {
    const settings = req.body; // Expect object { key: value, key2: value2 }

    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    db.serialize(() => {
        try {
            db.run('BEGIN TRANSACTION');

            for (const [key, value] of Object.entries(settings)) {
                stmt.run(key, String(value));
            }

            db.run('COMMIT');
            stmt.finalize();
            res.json({ success: true });
        } catch (err) {
            db.run('ROLLBACK');
            stmt.finalize();
            res.status(500).json({ error: err.message });
        }
    });
});

// Test Notification - Telegram
router.post('/test-telegram', async (req, res) => {
    const { token, chatId } = req.body;
    const { sendTelegramMessage } = require('../services/telegram');

    try {
        const success = await sendTelegramMessage(token, chatId, '🎉 **LaoWang Subscription**\n测试消息：您的 Telegram 通知配置成功！');
        if (success) {
            res.json({ success: true });
        } else {
            res.status(400).json({ error: '发送失败，请检查 Token 和 Chat ID' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Test Notification - Bark
router.post('/test-bark', async (req, res) => {
    const { barkUrl } = req.body;
    const { sendBarkNotification } = require('../services/bark');

    try {
        const success = await sendBarkNotification(barkUrl, '🎉 LaoWang Subscription', '测试消息：您的 Bark 通知配置成功！');
        if (success) {
            res.json({ success: true });
        } else {
            res.status(400).json({ error: '发送失败，请检查 Bark URL' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Test Notification - Webhook
router.post('/test-webhook', async (req, res) => {
    const { webhookUrl } = req.body;
    const { sendWebhookNotification } = require('../services/webhook');

    try {
        const payload = {
            type: 'test',
            message: '🎉 LaoWang Subscription 测试消息：您的 Webhook 通知配置成功！',
            timestamp: new Date().toISOString()
        };
        const success = await sendWebhookNotification(webhookUrl, payload);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(400).json({ error: '发送失败，请检查 Webhook URL' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Test Notification - WeChat
router.post('/test-wechat', async (req, res) => {
    const { wechatKey } = req.body;
    const { sendWechatNotification } = require('../services/wechat');

    try {
        const success = await sendWechatNotification(wechatKey, '🎉 **LaoWang Subscription**\n测试消息：您的企业微信通知配置成功！');
        if (success) {
            res.json({ success: true });
        } else {
            res.status(400).json({ error: '发送失败，请检查 Webhook Key' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Test Notification - Email
router.post('/test-email', async (req, res) => {
    const { emailHost, emailPort, emailUser, emailPass, emailTo } = req.body;
    const { sendEmailNotification } = require('../services/email');

    const config = {
        host: emailHost,
        port: parseInt(emailPort) || 465,
        secure: true,
        user: emailUser,
        pass: emailPass
    };

    try {
        const success = await sendEmailNotification(
            config,
            emailTo,
            '🎉 LaoWang Subscription 测试',
            '**测试消息**\n\n您的邮件通知配置成功！\n\n📧 发件人: ' + emailUser + '\n📬 收件人: ' + emailTo
        );
        if (success) {
            res.json({ success: true });
        } else {
            res.status(400).json({ error: '发送失败，请检查 SMTP 配置' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 触发自动续费检查 (Test Purpose)
router.post('/trigger-renew', (req, res) => {
    const { checkAutoRenew } = require('../cron/checker');
    console.log('Manually triggering auto-renew check...');
    checkAutoRenew();
    res.json({ success: true, message: 'Auto-renew check triggered' });
});

module.exports = router;

// ========== 外部触发 API（不需要 JWT 认证，使用 API Token） ==========
// 这个路由需要在 index.js 中单独注册
