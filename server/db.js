const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// 确保 database 目录存在
const dbDir = path.resolve(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Database directory created:', dbDir);
}

const dbPath = path.resolve(dbDir, 'subscription.db');
const schemaPath = path.resolve(dbDir, 'schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database at:', dbPath);
        initDb();
    }
});

function initDb() {
    // 检查 schema 文件是否存在
    if (!fs.existsSync(schemaPath)) {
        console.error('Schema file not found:', schemaPath);
        return;
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error initializing database schema:', err.message);
        } else {
            console.log('Database schema initialized.');
            createDefaultUser();
        }
    });
}

// 创建默认管理员用户
function createDefaultUser() {
    const defaultUsername = 'admin';
    const defaultPassword = 'admin';

    db.get('SELECT id FROM users WHERE username = ?', [defaultUsername], (err, row) => {
        if (err) {
            console.error('Error checking default user:', err.message);
            return;
        }

        if (!row) {
            const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
            db.run('INSERT INTO users (username, password) VALUES (?, ?)',
                [defaultUsername, hashedPassword],
                (insertErr) => {
                    if (insertErr) {
                        console.error('Error creating default user:', insertErr.message);
                    } else {
                        console.log('Default admin user created (admin/admin)');
                    }
                }
            );
        } else {
            console.log('Default admin user already exists.');
        }
    });
}

module.exports = db;
