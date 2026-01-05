const cron = require('node-cron');
const db = require('../db');
const { Lunar } = require('lunar-javascript');
const { sendTelegramMessage } = require('../services/telegram');
const { sendBarkNotification } = require('../services/bark');
const { sendWebhookNotification } = require('../services/webhook');
const { sendWechatNotification } = require('../services/wechat');
const { sendEmailNotification } = require('../services/email');

let cronTask = null;

// 鍚姩瀹氭椂浠诲姟
const startCronJob = () => {
    // 榛樿姣忓ぉ鍖椾含鏃堕棿9鐐?(UTC 1:00)
    const defaultCron = '0 1 * * *';

    // 鑾峰彇鐢ㄦ埛閰嶇疆鐨?cron 琛ㄨ揪寮?
    db.get('SELECT value FROM settings WHERE key = "cron_expression"', [], (err, row) => {
        const cronExpression = (row && row.value) || defaultCron;

        // 楠岃瘉 cron 琛ㄨ揪寮?
        if (!cron.validate(cronExpression)) {
            console.warn(`Invalid cron expression: ${cronExpression}, using default: ${defaultCron}`);
            scheduleCron(defaultCron);
        } else {
            scheduleCron(cronExpression);
        }
    });
};

const scheduleCron = (expression) => {
    // 濡傛灉宸叉湁浠诲姟锛屽厛鍋滄
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

// 妫€鏌ヨ闃呭埌鏈燂紙浣跨敤閰嶇疆鐨勬椂鍖猴級
const checkSubscriptions = () => {
    // 棣栧厛鑾峰彇鏃跺尯璁剧疆
    db.get('SELECT value FROM settings WHERE key = "timezone"', [], (err, row) => {
        const timezone = row?.value || 'Asia/Shanghai';

        // 浣跨敤閰嶇疆鐨勬椂鍖鸿幏鍙栦粖澶╃殑鏃ユ湡
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD 鏍煎紡
        const today = new Date(todayStr);
        today.setHours(0, 0, 0, 0);

        console.log(`[Checker] Running with timezone: ${timezone}, today: ${todayStr}`);

        db.all(`
            SELECT s.*, u.username 
            FROM subscriptions s 
            LEFT JOIN users u ON s.user_id = u.id 
            WHERE s.status = "active"
        `, [], async (err, rows) => {
            if (err) {
                console.error('Cron DB error:', err);
                return;
            }

            for (const sub of rows) {
                const expireDate = new Date(sub.expire_date);
                expireDate.setHours(0, 0, 0, 0);

                const diffTime = expireDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // 妫€鏌ユ槸鍚﹀尮閰嶆彁閱掑ぉ鏁?
                if (diffDays === sub.remind_days) {
                    await sendNotification(sub, diffDays);
                }

                // 鍒版湡褰撳ぉ涔熸彁閱掞紙濡傛灉鎻愰啋澶╂暟涓嶆槸0锛?
                if (diffDays === 0 && sub.remind_days !== 0) {
                    await sendNotification(sub, 0);
                }

                // 宸茶繃鏈熸彁閱掞紙杩囨湡1-3澶╁唴姣忓ぉ鍙戜竴娆★級
                if (diffDays < 0 && diffDays >= -3) {
                    await sendNotification(sub, diffDays);
                }
            }
        });
    });
};

// 妫€鏌ヨ嚜鍔ㄧ画璐?
const checkAutoRenew = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    db.all(`
        SELECT s.*, u.username 
        FROM subscriptions s 
        LEFT JOIN users u ON s.user_id = u.id 
        WHERE s.status = "active" AND s.auto_renew = 1
    `, [], async (err, rows) => {
        if (err) {
            console.error('AutoRenew DB error:', err);
            return;
        }

        for (const sub of rows) {
            const expireDate = new Date(sub.expire_date);
            expireDate.setHours(0, 0, 0, 0);

            // 濡傛灉宸茶繃鏈熸垨浠婂ぉ鍒版湡
            if (expireDate <= today) {
                // 璁＄畻鏂扮殑杩囨湡鏃堕棿
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

                // 鏇存柊鏁版嵁搴?
                db.run('UPDATE subscriptions SET expire_date = ? WHERE id = ?', [newDateStr, sub.id], (updateErr) => {
                    if (updateErr) {
                        console.error(`Failed to auto-renew sub ${sub.id}:`, updateErr);
                    } else {
                        console.log(`Auto-renewed sub ${sub.name} (ID: ${sub.id}) to ${newDateStr}`);
                        // 鍙戦€佺画璐归€氱煡
                        sendNotification(sub, value + ' ' + unit + ' (鑷姩缁垂鎴愬姛)');
                    }
                });
            }
        }
    });
};

// 鍙戦€侀€氱煡
const sendNotification = async (sub, daysLeft) => {
    // 鑾峰彇璁剧疆
    db.all('SELECT * FROM settings', [], async (err, rows) => {
        if (err) return;

        const settings = {};
        rows.forEach(row => settings[row.key] = row.value);

        // 鏋勫缓閫氱煡娑堟伅
        const statusText = daysLeft < 0 ? `宸茶繃鏈?${Math.abs(daysLeft)} 澶ー : `鍓╀綑 ${daysLeft} 澶ー;
        const urgencyEmoji = daysLeft <= 0 ? '馃毃' : (daysLeft <= 3 ? '鈿狅笍' : '馃摙');

        let message = `
${urgencyEmoji} **璁㈤槄鍒版湡鎻愰啋**

馃摝 **鍚嶇О**: ${sub.name}
馃彿锔?**绫诲瀷**: ${sub.category || '鏃?}
馃搮 **鍒版湡**: ${sub.expire_date}
鈴?**鐘舵€?*: ${statusText}
馃摑 **澶囨敞**: ${sub.notes || '鏃?}
`;

        // 濡傛灉寮€鍚簡鍐滃巻鏄剧ず
        if (settings['show_lunar'] === 'true') {
            try {
                const date = new Date(sub.expire_date);
                const lunar = Lunar.fromDate(date);
                const lunarStr = lunar.toString();
                message = message + '\n馃寶 **鍐滃巻**: ' + lunarStr;
            } catch (e) {
                console.error('Lunar conversion failed:', e);
            }
        }

        message += `

        璇峰強鏃跺鐞嗭紒
                `.trim();

        // 鍙戦€佸埌鍚勪釜娓犻亾
        const promises = [];

        // Telegram
        if (settings['enable_telegram'] === 'true') {
            const tgToken = settings['telegram_token'];
            const tgChatId = settings['telegram_chat_id'];
            if (tgToken && tgChatId) {
                promises.push(
                    sendTelegramMessage(tgToken, tgChatId, message)
                        .then(() => console.log(`鉁?Telegram notification sent for ${sub.name}`))
                        .catch(e => console.error(`鉂?Telegram failed for ${sub.name}: `, e.message))
                );
            }
        }

        // Bark
        if (settings['enable_bark'] === 'true') {
            const barkUrl = settings['bark_url'];
            if (barkUrl) {
                const title = `${urgencyEmoji} ${sub.name} ${statusText} `;
                const body = `绫诲瀷: ${sub.category || '鏃?} | 鍒版湡: ${sub.expire_date} `;
                promises.push(
                    sendBarkNotification(barkUrl, title, body)
                        .then(() => console.log(`鉁?Bark notification sent for ${sub.name}`))
                        .catch(e => console.error(`鉂?Bark failed for ${sub.name}: `, e.message))
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
                        .then(() => console.log(`鉁?Webhook notification sent for ${sub.name}`))
                        .catch(e => console.error(`鉂?Webhook failed for ${sub.name}: `, e.message))
                );
            }
        }

        // 浼佷笟寰俊
        if (settings['enable_wechat'] === 'true') {
            const wechatKey = settings['wechat_key'];
            if (wechatKey) {
                promises.push(
                    sendWechatNotification(wechatKey, message)
                        .then(() => console.log(`鉁?WeChat notification sent for ${sub.name}`))
                        .catch(e => console.error(`鉂?WeChat failed for ${sub.name}: `, e.message))
                );
            }
        }

        // 閭欢閫氱煡
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
                const subject = `${urgencyEmoji} 璁㈤槄鎻愰啋: ${sub.name} ${statusText}`;
                promises.push(
                    sendEmailNotification(emailConfig, emailTo, subject, message)
                        .then(() => console.log(`鉁?Email notification sent for ${sub.name}`))
                        .catch(e => console.error(`鉂?Email failed for ${sub.name}: `, e.message))
                );
            }
        }

        await Promise.allSettled(promises);
    });
};

// 鎵嬪姩瑙﹀彂妫€鏌ワ紙鐢ㄤ簬娴嬭瘯锛?
const triggerCheck = () => {
    console.log('Manually triggering subscription check...');
    checkSubscriptions();
};

// 鍙戦€佸崟涓闃呯殑娴嬭瘯閫氱煡
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
            resolve({ success: true, message: '娴嬭瘯閫氱煡宸插彂閫? });
        });
    });
};

module.exports = { startCronJob, triggerCheck, sendTestNotification, checkAutoRenew, checkSubscriptions };
