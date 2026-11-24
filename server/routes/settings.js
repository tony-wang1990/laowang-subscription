const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

// Middleware to check auth
const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const { JWT_SECRET: SECRET_KEY } = require('../config');

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.userId = decoded.id;
        next();
    });
};

router.use(authenticate);

// 允许写入的设置 key 白名单（与前端 Settings.vue 实际使用的字段一致）
const ALLOWED_SETTINGS_KEYS = new Set([
    'show_lunar',
    'timezone',
    'cron_expression',
    'enable_telegram',
    'enable_bark',
    'enable_webhook',
    'enable_wechat',
    'enable_email',
    'api_token',
    'telegram_token',
    'telegram_chat_id',
    'bark_url',
    'webhook_url',
    'wechat_key',
    'email_host',
    'email_port',
    'email_user',
    'email_pass',
    'email_to',
]);

// 敏感字段：GET 只返回是否已配置，绝不返回原始值
// （含 URL 的字段也视为敏感，因为 Bark/Webhook URL 中带有密钥）
const SENSITIVE_SETTINGS_KEYS = new Set([
    'api_token',
    'telegram_token',
    'bark_url',
    'webhook_url',
    'wechat_key',
    'email_pass',
]);

// Get all settings — 敏感字段脱敏返回 { configured: true/false }
router.get('/', (req, res) => {
    db.all('SELECT * FROM settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => {
            if (SENSITIVE_SETTINGS_KEYS.has(row.key)) {
                settings[row.key] = { configured: Boolean(row.value) };
            } else {
                settings[row.key] = row.value;
            }
        });
        res.json(settings);
    });
});

// Update settings (bulk or single) — 仅允许白名单 key
router.post('/', (req, res) => {
    const settings = req.body; // Expect object { key: value, key2: value2 }

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
        return res.status(400).json({ error: 'Settings must be an object' });
    }

    const entries = Object.entries(settings);
    const unknownKeys = entries.map(([key]) => key).filter((key) => !ALLOWED_SETTINGS_KEYS.has(key));
    if (unknownKeys.length > 0) {
        return res.status(400).json({ error: `Unknown settings keys: ${unknownKeys.join(', ')}` });
    }

    // 过滤掉前端回显的脱敏占位值 { configured: ... }：视为“未改动”，不覆盖原值
    const writable = entries.filter(([, value]) => {
        return !(value && typeof value === 'object' && 'configured' in value);
    });

    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    db.serialize(() => {
        try {
            db.run('BEGIN TRANSACTION');

            for (const [key, value] of writable) {
                if (value === null || value === undefined) continue;
                if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
                    throw new Error(`Invalid value type for setting "${key}"`);
                }
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

// Backup Database
router.get('/backup', (req, res) => {
    const path = require('path');
    const dbPath = path.resolve(__dirname, '../../database/subscription.db');
    res.download(dbPath, 'subscription_backup.db', (err) => {
        if (err) {
            console.error('Download error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Backup failed' });
            }
        }
    });
});

module.exports = router;
