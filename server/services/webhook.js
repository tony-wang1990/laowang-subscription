const axios = require('axios');

/**
 * 发送 Webhook 通知
 * @param {string} webhookUrl - Webhook URL
 * @param {object} payload - 通知数据
 */
const sendWebhookNotification = async (webhookUrl, payload) => {
    if (!webhookUrl) {
        console.error('Webhook URL missing');
        return false;
    }

    try {
        await axios.post(webhookUrl, payload, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        console.log('Webhook notification sent successfully');
        return true;
    } catch (error) {
        console.error('Webhook send error:', error.message);
        return false;
    }
};

module.exports = { sendWebhookNotification };
