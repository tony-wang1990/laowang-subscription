const axios = require('axios');

/**
 * 发送企业微信机器人通知
 * @param {string} webhookKey - 企业微信机器人 Webhook Key
 * @param {string} content - 消息内容 (Markdown格式)
 */
const sendWechatNotification = async (webhookKey, content) => {
    if (!webhookKey) {
        console.error('WeChat webhook key missing');
        return false;
    }

    try {
        const url = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${webhookKey}`;
        await axios.post(url, {
            msgtype: 'markdown',
            markdown: {
                content: content
            }
        });
        console.log('WeChat notification sent successfully');
        return true;
    } catch (error) {
        console.error('WeChat send error:', error.message);
        return false;
    }
};

module.exports = { sendWechatNotification };
