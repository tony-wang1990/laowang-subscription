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
                    name: 'Google Domains (example.com)',
                    category: '域名',
                    expire_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60天后
                    cycle: 'year',
                    price: '12.00',
                    currency: 'USD',
                    auto_renew: 0,
                    remind_days: 7,
                    status: 'active',
                    note: '主力域名，千万别忘了续费！'
                },
                {
                    name: 'Netflix 4K 高级会员',
                    category: '流媒体',
                    expire_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5天后
                    cycle: 'month',
                    price: '45.00',
                    currency: 'TRY',
                    auto_renew: 1,
                    remind_days: 3,
                    status: 'active',
                    note: '土耳其区车队，记得给车主转账'
                },
                {
                    name: '中国移动话费 (138****0000)',
                    category: '生活缴费',
                    expire_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10天后
                    cycle: 'month',
                    price: '58.00',
                    currency: 'CNY',
                    auto_renew: 0,
                    remind_days: 3,
                    status: 'active',
                    note: '月底扣费，保持余额充足'
                },
                {
                    name: '招商银行信用卡还款',
                    category: '金融',
                    expire_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3天后
                    cycle: 'month',
                    price: '0.00',
                    currency: 'CNY',
                    auto_renew: 0,
                    remind_days: 5,
                    status: 'active',
                    note: '账单日: 5号，还款日: 25号'
                },
                {
                    name: '甲骨文云 (Oracle Cloud)',
                    category: 'VPS',
                    expire_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    cycle: 'year',
                    price: '0.00',
                    currency: 'USD',
                    auto_renew: 1,
                    remind_days: 7,
                    status: 'active',
                    note: 'ARM 4核 24G 永久免费机器'
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
