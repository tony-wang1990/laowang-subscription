const axios = require('axios');

const sendTelegramMessage = async (token, chatId, message) => {
    if (!token || !chatId) {
        console.error('Telegram token or chat ID missing');
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });
        return true;
    } catch (error) {
        console.error('Telegram send error:', error.message);
        return false;
    }
};

module.exports = { sendTelegramMessage };
