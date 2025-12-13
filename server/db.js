const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// 确保 database 目录存在
// 数据库目录策略：
// 1. 优先使用环境变量 DATA_DIR
// 2. 其次尝试 /app/database (如果存在且可写)
// 3. 最后降级到 /tmp (Serverless/只读环境)

let dbDir = process.env.DATA_DIR || path.resolve(__dirname, '../database');
let useTmp = false;

try {
    // 如果目录不存在，尝试创建（在只读系统上这会失败，转入 catch）
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    // 测试写入权限
    const testFile = path.join(dbDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
} catch (e) {
    console.warn(`Primary DB dir ${dbDir} is not writable. Using /tmp.`);
    useTmp = true;
    dbDir = '/tmp'; // 降级
}

const dbPath = path.resolve(dbDir, 'subscription.db');
// 确保 schema.sql 总能找到
const schemaPath = path.resolve(__dirname, 'schema.sql');

console.log(`Using database at: ${dbPath}`);

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
            checkAndMigrate();
            createDefaultUser();
        }
    });
}

// 检查并迁移缺失的列
function checkAndMigrate() {
    const columns = [
        { name: 'cycle', type: 'TEXT' },
        { name: 'price', type: 'TEXT' },
        { name: 'currency', type: 'TEXT DEFAULT "CNY"' },
        { name: 'auto_renew', type: 'BOOLEAN DEFAULT 0' },
        { name: 'note', type: 'TEXT' }
    ];

    columns.forEach(col => {
        db.run(`ALTER TABLE subscriptions ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error(`Error adding column ${col.name}:`, err.message);
            } else if (!err) {
                console.log(`Added missing column: ${col.name}`);
            }
        });
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
                        createSampleData(); // 创建完用户后检查是否需要创建演示数据
                    }
                }
            );
        } else {
            console.log('Default admin user already exists.');
            createSampleData(); // 用户存在也要检查数据，防止空表
        }
    });
}

// 创建演示数据
function createSampleData() {
    db.get('SELECT count(*) as count FROM subscriptions', [], (err, row) => {
        if (err) return;
        if (row.count === 0) {
            console.log('Creating sample subscriptions...');
            const samples = [
                {
                    name: '甲骨文云 (Oracle Cloud)',
                    category: 'VPS',
                    expire_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30天后
                    cycle: 'month',
                    price: '0.00',
                    currency: 'USD',
                    auto_renew: 1,
                    remind_days: 3,
                    status: 'active',
                    note: 'ARM 4核 24G 永久免费实例'
                },
                {
                    name: 'Netflix 4K 高级会员',
                    category: '流媒体',
                    expire_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5天后
                    cycle: 'month',
                    price: '15.00',
                    currency: 'CNY',
                    auto_renew: 1,
                    remind_days: 7,
                    status: 'active',
                    note: '拼车账号，记得续费'
                },
                {
                    name: '搬瓦工 GIA-E',
                    category: 'VPS',
                    expire_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    cycle: 'year',
                    price: '49.99',
                    currency: 'USD',
                    auto_renew: 0,
                    remind_days: 14,
                    status: 'active',
                    note: '传家宝套餐'
                },
                {
                    name: 'Spotify Premium',
                    category: '音乐',
                    expire_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 过期2天
                    cycle: 'year',
                    price: '99.00',
                    currency: 'HKD',
                    auto_renew: 1,
                    remind_days: 3,
                    status: 'active',
                    note: '家庭组车主'
                }
            ];

            const stmt = db.prepare('INSERT INTO subscriptions (user_id, name, category, expire_date, cycle, price, currency, auto_renew, remind_days, status, note) VALUES ((SELECT id FROM users LIMIT 1), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

            samples.forEach(s => {
                stmt.run(s.name, s.category, s.expire_date, s.cycle, s.price, s.currency, s.auto_renew, s.remind_days, s.status, s.note);
            });
            stmt.finalize();
            console.log('Sample data created.');
        }
    });
}

module.exports = db;
