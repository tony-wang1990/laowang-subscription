const cron = require('node-cron');
const db = require('../db');
const { Lunar } = require('lunar-javascript');
const { sendTelegramMessage } = require('../services/telegram');
const { sendBarkNotification } = require('../services/bark');
const { sendWebhookNotification } = require('../services/webhook');
const { sendWechatNotification } = require('../services/wechat');
const { sendEmailNotification } = require('../services/email');

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
        checkAutoRenew();
    });
};

// 检查订阅到期（使用配置的时区）
const checkSubscriptions = () => {
    // 首先获取时区设置
    db.get('SELECT value FROM settings WHERE key = "timezone"', [], (err, row) => {
        const timezone = row?.value || 'Asia/Shanghai';

        // 使用配置的时区获取今天的日期
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD 格式
        const today = new Date(todayStr);
        today.setHours(0, 0, 0, 0);

        console.log(`[Checker] Running with timezone: ${timezone}, today: ${todayStr}`);

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
                    await sendNotification(sub, diffDays);
                }

                // 到期当天也提醒（如果提醒天数不是0）
                if (diffDays === 0 && sub.remind_days !== 0) {
                    await sendNotification(sub, 0);
                }

                // 已过期提醒（过期1-3天内每天发一次）
                if (diffDays < 0 && diffDays >= -3) {
                    await sendNotification(sub, diffDays);
                }
            }
        });
    });
};

// 检查自动续费
const checkAutoRenew = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    db.all('SELECT * FROM subscriptions WHERE status = "active" AND auto_renew = 1', [], async (err, rows) => {
        if (err) {
            console.error('AutoRenew DB error:', err);
            return;
        }

        for (const sub of rows) {
            const expireDate = new Date(sub.expire_date);
            expireDate.setHours(0, 0, 0, 0);

            // 如果已过期或今天到期
            if (expireDate <= today) {
                // 计算新的过期时间
                let newDate = new Date(expireDate);
                const value = parseInt(sub.cycle_value || 1);
                const unit = sub.cycle_unit || 'month';

                if (unit === 'day') {
                    newDate.setDate(newDate.getDate() + value);
                } else if (unit === 'month') {
                    newDate.setMonth(newDate.getMonth() + value);
                } else if (unit === 'year') {
                    newDate.setFullYear(newDate.getFullYear() + value);
                }

                const newDateStr = newDate.toISOString().split('T')[0];

                // 更新数据库
                db.run('UPDATE subscriptions SET expire_date = ? WHERE id = ?', [newDateStr, sub.id], (updateErr) => {
                    if (updateErr) {
                        console.error(`Failed to auto-renew sub ${sub.id}:`, updateErr);
                    } else {
                        console.log(`Auto-renewed sub ${sub.name} (ID: ${sub.id}) to ${newDateStr}`);
                        // 发送续费通知
                        sendNotification(sub, value + ' ' + unit + ' (自动续费成功)');
                    }
                });
            }
        }
    });
};

// 发送通知
const sendNotification = async (sub, daysLeft) => {
    // 获取设置
    db.all('SELECT * FROM settings', [], async (err, rows) => {
        if (err) return;

        const settings = {};
        rows.forEach(row => settings[row.key] = row.value);

        // 构建通知消息
        const statusText = daysLeft < 0 ? `已过期 ${Math.abs(daysLeft)} 天` : `剩余 ${daysLeft} 天`;
        const urgencyEmoji = daysLeft <= 0 ? '🚨' : (daysLeft <= 3 ? '⚠️' : '📢');

        let message = `
${urgencyEmoji} **订阅到期提醒**

📦 **名称**: ${sub.name}
🏷️ **类型**: ${sub.category || '无'}
📅 **到期**: ${sub.expire_date}
⏳ **状态**: ${statusText}
📝 **备注**: ${sub.notes || '无'}
`;

        // 如果开启了农历显示
        if (settings['show_lunar'] === 'true') {
            try {
                const date = new Date(sub.expire_date);
                const lunar = Lunar.fromDate(date);
                const lunarStr = lunar.toString();
                message = message + '\n🌚 **农历**: ' + lunarStr;
            } catch (e) {
                console.error('Lunar conversion failed:', e);
            }
        }

        message += `

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
                        .catch(e => console.error(`❌ Telegram failed for ${sub.name}: `, e.message))
                );
            }
        }

        // Bark
        if (settings['enable_bark'] === 'true') {
            const barkUrl = settings['bark_url'];
            if (barkUrl) {
                const title = `${urgencyEmoji} ${sub.name} ${statusText} `;
                const body = `类型: ${sub.category || '无'} | 到期: ${sub.expire_date} `;
                promises.push(
                    sendBarkNotification(barkUrl, title, body)
                        .then(() => console.log(`✅ Bark notification sent for ${sub.name}`))
                        .catch(e => console.error(`❌ Bark failed for ${sub.name}: `, e.message))
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
                        .catch(e => console.error(`❌ Webhook failed for ${sub.name}: `, e.message))
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
                        .catch(e => console.error(`❌ WeChat failed for ${sub.name}: `, e.message))
                );
            }
        }

        // 邮件通知
        if (settings['enable_email'] === 'true') {
            const emailTo = settings['email_to'];
            const emailConfig = {
                host: settings['email_host'],
                port: parseInt(settings['email_port']) || 465,
                secure: settings['email_secure'] !== 'false',
                user: settings['email_user'],
                pass: settings['email_pass']
            };

            if (emailConfig.host && emailConfig.user && emailConfig.pass && emailTo) {
                const subject = `${urgencyEmoji} 订阅提醒: ${sub.name} ${statusText}`;
                promises.push(
                    sendEmailNotification(emailConfig, emailTo, subject, message)
                        .then(() => console.log(`✅ Email notification sent for ${sub.name}`))
                        .catch(e => console.error(`❌ Email failed for ${sub.name}: `, e.message))
                );
            }
        }

        await Promise.allSettled(promises);
    });
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

            const expireDate = new Date(sub.expire_date);
            const today = new Date();
            expireDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            const daysLeft = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));

            await sendNotification(sub, daysLeft);
            resolve({ success: true, message: '测试通知已发送' });
        });
    });
};

module.exports = { startCronJob, triggerCheck, sendTestNotification, checkAutoRenew, checkSubscriptions };
