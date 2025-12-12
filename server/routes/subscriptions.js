const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to check auth
const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const jwt = require('jsonwebtoken');
    const SECRET_KEY = process.env.JWT_SECRET || 'laowang-secret-key';

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.userId = decoded.id;
        next();
    });
};

router.use(authenticate);

// Get all subscriptions
router.get('/', (req, res) => {
    const { search, category } = req.query;
    let query = 'SELECT * FROM subscriptions WHERE user_id = ?';
    let params = [req.userId];

    if (search) {
        query += ' AND (name LIKE ? OR notes LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (category && category !== 'all') {
        query += ' AND category = ?';
        params.push(category);
    }

    query += ' ORDER BY expire_date ASC';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create subscription
router.post('/', (req, res) => {
    console.log('Received create subscription request:', req.body);
    const {
        name, category, expire_date, remind_days,
        cycle_value, cycle_unit, is_lunar, notes
    } = req.body;

    if (!name || !expire_date) {
        console.error('Validation error: Missing name or expire_date');
        return res.status(400).json({ error: 'Name and expire_date are required' });
    }

    const sql = `
    INSERT INTO subscriptions (
      user_id, name, category, expire_date, remind_days,
      cycle_value, cycle_unit, is_lunar, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const params = [
        req.userId, name, category, expire_date, remind_days || 3,
        cycle_value, cycle_unit, is_lunar ? 1 : 0, notes
    ];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Database insertion error:', err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log('Subscription created with ID:', this.lastID);
        res.json({ id: this.lastID, ...req.body });
    });
});

// Update subscription
router.put('/:id', (req, res) => {
    const {
        name, category, expire_date, remind_days,
        cycle_value, cycle_unit, is_lunar, notes, status
    } = req.body;

    const sql = `
    UPDATE subscriptions SET
      name = ?, category = ?, expire_date = ?, remind_days = ?,
      cycle_value = ?, cycle_unit = ?, is_lunar = ?, notes = ?, status = ?
    WHERE id = ? AND user_id = ?
  `;

    const params = [
        name, category, expire_date, remind_days,
        cycle_value, cycle_unit, is_lunar ? 1 : 0, notes, status,
        req.params.id, req.userId
    ];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Subscription not found' });
        res.json({ success: true });
    });
});

// Delete subscription
router.delete('/:id', (req, res) => {
    db.run('DELETE FROM subscriptions WHERE id = ? AND user_id = ?', [req.params.id, req.userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Subscription not found' });
        res.json({ success: true });
    });
});

// Toggle Status
// Reusing PUT logic for now as frontend sends full object with new status

// Test Notification
router.post('/:id/test', async (req, res) => {
    const { sendTestNotification } = require('../cron/checker');
    try {
        const result = await sendTestNotification(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
