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

// Register (First user only or admin)
router.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Check if any user exists
    db.get('SELECT count(*) as count FROM users', [], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        // If users exist, maybe restrict registration? For now allow it for simplicity or check a secret code
        // Implementing simple registration for now

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

        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ error: '新密码至少需要4个字符' });
        }

        db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, user) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (!user) return res.status(404).json({ error: 'User not found' });

            // 如果提供了当前密码，验证它
            if (currentPassword) {
                const isValid = bcrypt.compareSync(currentPassword, user.password);
                if (!isValid) {
                    return res.status(401).json({ error: '当前密码错误' });
                }
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
