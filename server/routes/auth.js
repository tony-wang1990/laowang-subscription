const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const { JWT_SECRET: SECRET_KEY } = require('../config');

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, username: user.username } });
    });
});

// Register — 仅在用户数为 0 时可用（首次建库引导）；已有用户后一律 403。
// 注意：首次启动 db.js 已自动创建随机口令的 admin 账号，因此正常部署下
// 注册接口始终关闭；如需新建账号请登录后在数据库/管理流程中处理。
router.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: '密码至少需要8个字符' });
    }

    // Check if any user exists
    db.get('SELECT count(*) as count FROM users', [], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (row.count > 0) {
            return res.status(403).json({ error: 'Registration is disabled: users already exist' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }

            const token = jwt.sign({ id: this.lastID, username }, SECRET_KEY, { expiresIn: '7d' });
            res.json({ token, user: { id: this.lastID, username } });
        });
    });
});

// Change Password (需要认证)
router.post('/change-password', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });

        const { currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: '新密码至少需要8个字符' });
        }

        // 改密必须提供并校验当前密码；不提供当前密码不得直接改密
        if (!currentPassword) {
            return res.status(400).json({ error: '请提供当前密码' });
        }

        db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, user) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (!user) return res.status(404).json({ error: 'User not found' });

            const isValid = bcrypt.compareSync(currentPassword, user.password);
            if (!isValid) {
                return res.status(401).json({ error: '当前密码错误' });
            }

            // 更新密码
            const hashedPassword = bcrypt.hashSync(newPassword, 10);
            db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id], function (err) {
                if (err) return res.status(500).json({ error: 'Failed to update password' });
                res.json({ success: true, message: '密码修改成功' });
            });
        });
    });
});

module.exports = router;
