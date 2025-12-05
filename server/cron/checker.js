const cron = require('node-cron');
const db = require('../db');
const { sendTelegramMessage } = require('../services/telegram');

// Check every day at 9:00 AM
const startCronJob = () => {
    console.log('Starting cron job: 0 9 * * *');

    cron.schedule('0 9 * * *', () => {
        console.log('Running subscription check...');
        checkSubscriptions();
    });
};

const checkSubscriptions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

            // Check if today matches the remind day
            if (diffDays === sub.remind_days) {
                await sendNotification(sub, diffDays);
            }

            // Also remind on the exact day
            if (diffDays === 0 && sub.remind_days !== 0) {
                await sendNotification(sub, 0);
            }
        }
    });
};

const sendNotification = async (sub, daysLeft) => {
    // Get user settings for notification
    // For MVP, we assume global settings or user settings stored in 'settings' table
    // But wait, 'settings' table is key-value.
    // Let's fetch settings.

    db.all('SELECT * FROM settings', [], async (err, rows) => {
        if (err) return;

        const settings = {};
        rows.forEach(row => settings[row.key] = row.value);

        const tgToken = settings['telegram_token'];
        const tgChatId = settings['telegram_chat_id'];

        if (tgToken && tgChatId) {
            const message = `
⚠️ **订阅到期提醒**

📦 **名称**: ${sub.name}
🏷️ **类型**: ${sub.category || '无'}
📅 **到期**: ${sub.expire_date}
⏳ **剩余**: ${daysLeft} 天
📝 **备注**: ${sub.notes || '无'}

请及时续费！
      `;

            await sendTelegramMessage(tgToken, tgChatId, message);
            console.log(`Notification sent for ${sub.name}`);
        }
    });
};

module.exports = { startCronJob };
