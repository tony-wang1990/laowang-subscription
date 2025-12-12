const axios = require('axios');

/**
 * 发送 Bark 通知 (iOS)
 * @param {string} barkUrl - Bark 服务器URL (例: https://api.day.app/YourKey/)
 * @param {string} title - 通知标题
 * @param {string} body - 通知内容
 */
const sendBarkNotification = async (barkUrl, title, body) => {
    if (!barkUrl) {
        console.error('Bark URL missing');
        return false;
    }

    try {
        // 确保URL末尾有斜杠
        const url = barkUrl.endsWith('/') ? barkUrl : barkUrl + '/';
        await axios.post(url, {
            title: title,
            body: body,
            group: 'LaoWang订阅',
            icon: 'https://raw.githubusercontent.com/tony-wang1990/laowang-subscription/main/docs/images/logo.png'
        });
        console.log('Bark notification sent successfully');
        return true;
    } catch (error) {
        console.error('Bark send error:', error.message);
        return false;
    }
};

module.exports = { sendBarkNotification };
