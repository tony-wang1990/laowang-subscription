const cron = require('node-cron');
const db = require('../db');
const { sendTelegramMessage } = require('../services/telegram');
const { sendBarkNotification } = require('../services/bark');
const { sendWebhookNotification } = require('../services/webhook');
const { sendWechatNotification } = require('../services/wechat');

let cronTask = null;

// 启动定时任务
const startCronJob = () => {
    // 默认每天北京时间9点 (UTC 1:00)
    const defaultCron = '0 1 * * *';

    // 获取用户配置的 cron 表达式
    db.get('SELECT value FROM settings WHERE key = "cron_expression"', [], (err, row) => {
        const cronExpression = (row && row.value) || defaultCron;

        // 验证 cron 表达式
        if (!cron.validate(cronExpression)) {
            console.warn(`Invalid cron expression: ${cronExpression}, using default: ${defaultCron}`);
            scheduleCron(defaultCron);
        } else {
            scheduleCron(cronExpression);
        }
    });
};

const scheduleCron = (expression) => {
    // 如果已有任务，先停止
    if (cronTask) {
        cronTask.stop();
    }

    console.log(`Starting cron job: ${expression}`);
    cronTask = cron.schedule(expression, () => {
        console.log('Running subscription check at:', new Date().toISOString());
        checkSubscriptions();
    });
};

// 检查订阅到期
const checkSubscriptions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get settings once
    db.all('SELECT * FROM settings', [], (err, settingRows) => {
        if (err) {
            console.error('Cron Settings DB error:', err);
            return;
        }
        const settings = {};
        settingRows.forEach(row => settings[row.key] = row.value);

        db.all('SELECT * FROM subscriptions WHERE status = "active"', [], async (err, rows) => {
            if (err) {
                console.error('Cron DB error:', err);
                return;
            }

            for (const sub of rows) {
                const expireDate = new Date(sub.expire_date);
                expireDate.setHours(0, 0, 0, 0);

                const diffTime = expireDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // 检查是否匹配提醒天数
                if (diffDays === sub.remind_days) {
                    await sendNotification(sub, diffDays, settings);
                }

                // 到期当天也提醒（如果提醒天数不是0）
                if (diffDays === 0 && sub.remind_days !== 0) {
                    await sendNotification(sub, 0, settings);
                }

                // 已过期提醒（过期1-3天内每天发一次）
                if (diffDays < 0 && diffDays >= -3) {
                    await sendNotification(sub, diffDays, settings);
                }
            }
        });
    });
};

// 发送通知
const sendNotification = async (sub, daysLeft, settings) => {
    // 设置已在 checkSubscriptions 中获取并传入

    // 构建通知消息
    const statusText = daysLeft < 0 ? `已过期 ${Math.abs(daysLeft)} 天` : `剩余 ${daysLeft} 天`;
    const urgencyEmoji = daysLeft <= 0 ? '🚨' : (daysLeft <= 3 ? '⚠️' : '📢');

    const message = `
${urgencyEmoji} **订阅到期提醒**

📦 **名称**: ${sub.name}
🏷️ **类型**: ${sub.category || '无'}
📅 **到期**: ${sub.expire_date}
⏳ **状态**: ${statusText}
📝 **备注**: ${sub.notes || '无'}

请及时处理！
    `.trim();

    // 发送到各个渠道
    const promises = [];

    // Telegram
    if (settings['enable_telegram'] === 'true') {
        const tgToken = settings['telegram_token'];
        const tgChatId = settings['telegram_chat_id'];
        if (tgToken && tgChatId) {
            promises.push(
                sendTelegramMessage(tgToken, tgChatId, message)
                    .then(() => console.log(`✅ Telegram notification sent for ${sub.name}`))
                    .catch(e => console.error(`❌ Telegram failed for ${sub.name}:`, e.message))
            );
        }
    }

    // Bark
    if (settings['enable_bark'] === 'true') {
        const barkUrl = settings['bark_url'];
        if (barkUrl) {
            const title = `${urgencyEmoji} ${sub.name} ${statusText}`;
            const body = `类型: ${sub.category || '无'} | 到期: ${sub.expire_date}`;
            promises.push(
                sendBarkNotification(barkUrl, title, body)
                    .then(() => console.log(`✅ Bark notification sent for ${sub.name}`))
                    .catch(e => console.error(`❌ Bark failed for ${sub.name}:`, e.message))
            );
        }
    }

    // Webhook
    if (settings['enable_webhook'] === 'true') {
        const webhookUrl = settings['webhook_url'];
        if (webhookUrl) {
            const payload = {
                type: 'subscription_reminder',
                subscription: {
                    name: sub.name,
                    category: sub.category,
                    expire_date: sub.expire_date,
                    days_left: daysLeft,
                    notes: sub.notes
                },
                message: message,
                timestamp: new Date().toISOString()
            };
            promises.push(
                sendWebhookNotification(webhookUrl, payload)
                    .then(() => console.log(`✅ Webhook notification sent for ${sub.name}`))
                    .catch(e => console.error(`❌ Webhook failed for ${sub.name}:`, e.message))
            );
        }
    }

    // 企业微信
    if (settings['enable_wechat'] === 'true') {
        const wechatKey = settings['wechat_key'];
        if (wechatKey) {
            promises.push(
                sendWechatNotification(wechatKey, message)
                    .then(() => console.log(`✅ WeChat notification sent for ${sub.name}`))
                    .catch(e => console.error(`❌ WeChat failed for ${sub.name}:`, e.message))
            );
        }
    }

    await Promise.allSettled(promises);
};

// 手动触发检查（用于测试）
const triggerCheck = () => {
    console.log('Manually triggering subscription check...');
    checkSubscriptions();
};

// 发送单个订阅的测试通知
const sendTestNotification = async (subscriptionId) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId], async (err, sub) => {
            if (err) {
                reject(err);
                return;
            }
            if (!sub) {
                reject(new Error('Subscription not found'));
                return;
            }

            // Fetch settings for test notification
            db.all('SELECT * FROM settings', [], async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                const settings = {};
                rows.forEach(row => settings[row.key] = row.value);

                const expireDate = new Date(sub.expire_date);
                const today = new Date();
                expireDate.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
                const daysLeft = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));

                try {
                    await sendNotification(sub, daysLeft, settings);
                    resolve({ success: true, message: '测试通知已发送' });
                } catch (e) {
                    reject(e);
                }
            });
        });
    });
};

module.exports = { startCronJob, triggerCheck, sendTestNotification };
