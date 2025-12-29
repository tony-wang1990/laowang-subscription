const nodemailer = require('nodemailer');

/**
 * 发送邮件通知
 * @param {object} config - 邮件配置
 * @param {string} config.host - SMTP 服务器
 * @param {number} config.port - SMTP 端口
 * @param {boolean} config.secure - 是否使用 SSL
 * @param {string} config.user - 发件人邮箱
 * @param {string} config.pass - 邮箱密码/授权码
 * @param {string} to - 收件人邮箱
 * @param {string} subject - 邮件主题
 * @param {string} content - 邮件内容 (支持 HTML)
 */
const sendEmailNotification = async (config, to, subject, content) => {
    if (!config.host || !config.user || !config.pass || !to) {
        console.error('Email config incomplete');
        return false;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port || 465,
            secure: config.secure !== false, // 默认 true
            auth: {
                user: config.user,
                pass: config.pass
            }
        });

        // 将 Markdown 格式转换为简单 HTML
        const htmlContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/📦|🏷️|📅|⏳|📝|🚨|⚠️|📢|🌚/g, match => `<span style="font-size:16px">${match}</span>`);

        const mailOptions = {
            from: `"LaoWang Subscription" <${config.user}>`,
            to: to,
            subject: subject,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 22px;">🧭 LaoWang Subscription</h1>
                    </div>
                    <div style="background: white; padding: 25px; border-radius: 0 0 8px 8px; line-height: 1.8;">
                        ${htmlContent}
                    </div>
                    <div style="text-align: center; padding: 15px; color: #999; font-size: 12px;">
                        此邮件由 LaoWang Subscription 系统自动发送
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email notification sent successfully to:', to);
        return true;
    } catch (error) {
        console.error('Email send error:', error.message);
        return false;
    }
};

module.exports = { sendEmailNotification };
