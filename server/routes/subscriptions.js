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
        cycle_value, cycle_unit, cycle, is_lunar, notes,
        price, currency, auto_renew, note
    } = req.body;

    if (!name || !expire_date) {
        console.error('Validation error: Missing name or expire_date');
        return res.status(400).json({ error: 'Name and expire_date are required' });
    }

    const sql = `
    INSERT INTO subscriptions (
      user_id, name, category, expire_date, remind_days,
      cycle_value, cycle_unit, cycle, is_lunar, notes,
      price, currency, auto_renew, note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const params = [
        req.userId, name, category, expire_date, remind_days || 3,
        cycle_value || null, cycle_unit || null, cycle || null, is_lunar ? 1 : 0, notes || null,
        price || null, currency || 'CNY', auto_renew ? 1 : 0, note || null
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
        cycle_value, cycle_unit, cycle, is_lunar, notes, status,
        price, currency, auto_renew, note
    } = req.body;

    const sql = `
    UPDATE subscriptions SET
      name = ?, category = ?, expire_date = ?, remind_days = ?,
      cycle_value = ?, cycle_unit = ?, cycle = ?, is_lunar = ?, notes = ?, status = ?,
      price = ?, currency = ?, auto_renew = ?, note = ?
    WHERE id = ? AND user_id = ?
  `;

    const params = [
        name, category, expire_date, remind_days,
        cycle_value || null, cycle_unit || null, cycle || null, is_lunar ? 1 : 0, notes || null, status,
        price || null, currency || 'CNY', auto_renew ? 1 : 0, note || null,
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

// ========== 数据导入导出 ==========

// 导出所有订阅 (JSON)
router.get('/export/json', (req, res) => {
    db.all('SELECT * FROM subscriptions WHERE user_id = ?', [req.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const exportData = {
            version: '1.5.0',
            exportDate: new Date().toISOString(),
            count: rows.length,
            subscriptions: rows.map(row => ({
                name: row.name,
                category: row.category,
                expire_date: row.expire_date,
                remind_days: row.remind_days,
                cycle_value: row.cycle_value,
                cycle_unit: row.cycle_unit,
                price: row.price,
                currency: row.currency,
                auto_renew: row.auto_renew,
                status: row.status,
                notes: row.notes || row.note
            }))
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=laowang-subscriptions-${new Date().toISOString().split('T')[0]}.json`);
        res.json(exportData);
    });
});

// 导出为 CSV
router.get('/export/csv', (req, res) => {
    db.all('SELECT * FROM subscriptions WHERE user_id = ?', [req.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const headers = ['名称', '分类', '到期日期', '提醒天数', '周期值', '周期单位', '价格', '货币', '自动续费', '状态', '备注'];
        const csvRows = [headers.join(',')];

        rows.forEach(row => {
            const values = [
                `"${(row.name || '').replace(/"/g, '""')}"`,
                `"${(row.category || '').replace(/"/g, '""')}"`,
                row.expire_date,
                row.remind_days,
                row.cycle_value || '',
                row.cycle_unit || '',
                row.price || '',
                row.currency || 'CNY',
                row.auto_renew ? '是' : '否',
                row.status === 'active' ? '启用' : '停用',
                `"${((row.notes || row.note || '')).replace(/"/g, '""')}"`
            ];
            csvRows.push(values.join(','));
        });

        // 添加 BOM 以支持 Excel 中文
        const bom = '\uFEFF';
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=laowang-subscriptions-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(bom + csvRows.join('\n'));
    });
});

// 导入订阅 (JSON)
router.post('/import/json', (req, res) => {
    const { subscriptions } = req.body;

    if (!subscriptions || !Array.isArray(subscriptions)) {
        return res.status(400).json({ error: '无效的导入数据格式' });
    }

    let imported = 0;
    let failed = 0;

    const stmt = db.prepare(`
        INSERT INTO subscriptions (
            user_id, name, category, expire_date, remind_days,
            cycle_value, cycle_unit, price, currency, auto_renew, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    subscriptions.forEach(sub => {
        if (!sub.name || !sub.expire_date) {
            failed++;
            return;
        }

        stmt.run(
            req.userId,
            sub.name,
            sub.category || '其他',
            sub.expire_date,
            sub.remind_days || 3,
            sub.cycle_value || 1,
            sub.cycle_unit || 'month',
            sub.price || null,
            sub.currency || 'CNY',
            sub.auto_renew ? 1 : 0,
            sub.status || 'active',
            sub.notes || sub.note || null,
            (err) => {
                if (err) failed++;
                else imported++;
            }
        );
    });

    stmt.finalize(() => {
        res.json({
            success: true,
            message: `导入完成：成功 ${imported} 条，失败 ${failed} 条`,
            imported,
            failed
        });
    });
});

module.exports = router;
