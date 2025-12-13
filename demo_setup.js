const db = require('./server/db');
db.serialize(() => {
    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('show_lunar', 'true')", (err) => {
        if (err) console.error(err);
        else console.log('Enabled Lunar setting.');

        // Add a demo expired subscription
        const today = new Date().toISOString().split('T')[0];
        db.run(`INSERT INTO subscriptions (user_id, name, category, expire_date, remind_days, status) VALUES (1, 'Lunar Demo', 'Demo', ?, 0, 'active')`, [today], function (err) {
            if (err) console.error(err);
            else console.log('Added demo subscription.');
        });
    });
});
