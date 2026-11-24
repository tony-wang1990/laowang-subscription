CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  expire_date DATE NOT NULL,
  remind_days INTEGER DEFAULT 3,
  cycle_value INTEGER,
  cycle_unit TEXT,
  cycle TEXT,
  is_lunar BOOLEAN DEFAULT 0,
  price TEXT,
  currency TEXT DEFAULT 'CNY',
  auto_renew BOOLEAN DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- 注意：本文件只建表，不创建任何默认用户。
-- 首次启动由 server/db.js 在用户表为空时创建 admin 账号并生成随机口令（仅日志打印一次）。
