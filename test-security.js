// 最小安全回归测试：注册限制 + 改密规则 + 设置脱敏/白名单
// 用法：
//   node test-security.js            # 默认模式：断言空库不灌入演示数据
//   DEMO_DATA=1 node test-security.js # 演示模式：断言灌入演示数据
// 使用临时 SQLite（$TMPDIR 下的随机目录），不连真实服务，不启动长期服务。
// 首次启动的随机管理员口令从启动日志中截取（仅测试进程内使用，不落盘）。
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'laowang-subscription-test-'));
process.env.DATA_DIR = tmpDir;
process.env.JWT_SECRET = 'test-jwt-secret-for-security-test-only';
const demoMode = process.env.DEMO_DATA === '1';

// 截取启动日志，取出仅打印一次的随机初始口令
const logs = [];
const origLog = console.log;
console.log = (...args) => {
    logs.push(args.join(' '));
    origLog(...args);
};

const db = require('./server/db');

let passed = 0;
let failed = 0;
function check(name, cond, extra) {
    if (cond) {
        passed++;
        console.log(`  PASS: ${name}`);
    } else {
        failed++;
        console.log(`  FAIL: ${name}${extra ? ' — ' + extra : ''}`);
    }
}

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
});

async function waitFor(predicate, timeoutMs = 8000, label = 'condition') {
    const start = Date.now();
    for (;;) {
        try {
            if (await predicate()) return true;
        } catch (_) { /* 表尚未建好，重试 */ }
        if (Date.now() - start > timeoutMs) throw new Error(`timeout waiting for ${label}`);
        await new Promise((r) => setTimeout(r, 100));
    }
}

async function main() {
    // 等待首启初始化完成：admin 已创建；演示模式下演示数据已灌入
    await waitFor(async () => (await dbGet('SELECT count(*) as count FROM users')).count === 1, 8000, 'admin user');
    if (demoMode) {
        await waitFor(async () => (await dbGet('SELECT count(*) as count FROM subscriptions')).count > 0, 8000, 'sample data');
    }

    // 1. 随机口令只打印一次
    const markerCount = logs.filter((l) => l.includes('仅显示一次')).length;
    check('随机初始口令提示仅打印一次', markerCount === 1, `出现 ${markerCount} 次`);
    const pwdLine = logs.find((l) => /^ {2}[A-Za-z0-9_-]{24}$/.test(l));
    const initialPassword = pwdLine ? pwdLine.trim() : null;
    check('启动日志含 24 位随机初始口令', Boolean(initialPassword));

    // 2. 演示数据默认关闭
    const subCount = (await dbGet('SELECT count(*) as count FROM subscriptions')).count;
    if (demoMode) {
        check('DEMO_DATA=1 时灌入演示数据', subCount > 0, `count=${subCount}`);
    } else {
        check('默认不灌入演示数据（空库 subscriptions=0）', subCount === 0, `count=${subCount}`);
    }

    // 3. 启动最小 API 服务（仅挂 auth/settings 路由，临时端口，用完即关）
    const app = express();
    app.use(express.json());
    app.use('/api/auth', require('./server/routes/auth'));
    app.use('/api/settings', require('./server/routes/settings'));
    const server = await new Promise((resolve) => {
        const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    const req = async (method, p, body, token) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(base + p, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        let json = null;
        try { json = await res.json(); } catch (_) { /* ignore */ }
        return { status: res.status, json, text: JSON.stringify(json) };
    };

    try {
        // 4. 注册限制：已有用户时注册应 403
        const reg = await req('POST', '/api/auth/register', { username: 'attacker', password: 'somepassword1' });
        check('已有用户时注册返回 403', reg.status === 403, `status=${reg.status} body=${reg.text}`);

        // 5. 用随机初始口令登录
        const login = await req('POST', '/api/auth/login', { username: 'admin', password: initialPassword });
        check('随机初始口令可登录', login.status === 200 && Boolean(login.json && login.json.token), `status=${login.status} body=${login.text}`);
        const token = login.json && login.json.token;
        check('错误口令登录返回 401', (await req('POST', '/api/auth/login', { username: 'admin', password: 'wrong-password' })).status === 401);

        // 6. 改密规则
        check('不提供当前密码改密被拒绝', (await req('POST', '/api/auth/change-password', { newPassword: 'newpassword1' }, token)).status === 400);
        check('当前密码错误改密返回 401', (await req('POST', '/api/auth/change-password', { currentPassword: 'wrong', newPassword: 'newpassword1' }, token)).status === 401);
        check('新密码不足 8 位被拒绝', (await req('POST', '/api/auth/change-password', { currentPassword: initialPassword, newPassword: 'short' }, token)).status === 400);
        const chg = await req('POST', '/api/auth/change-password', { currentPassword: initialPassword, newPassword: 'newpassword1' }, token);
        check('提供正确当前密码 + 8 位新密码可改密', chg.status === 200, `status=${chg.status} body=${chg.text}`);
        check('新密码可登录', (await req('POST', '/api/auth/login', { username: 'admin', password: 'newpassword1' })).status === 200);
        check('旧口令改密后失效', (await req('POST', '/api/auth/login', { username: 'admin', password: initialPassword })).status === 401);
        const token2 = (await req('POST', '/api/auth/login', { username: 'admin', password: 'newpassword1' })).json.token;

        // 7. 设置脱敏与白名单
        const secret = 'SECRET-VALUE-DO-NOT-LEAK-12345';
        const save = await req('POST', '/api/settings', { telegram_token: secret, timezone: 'Asia/Shanghai', enable_telegram: true }, token2);
        check('保存已知 key 成功', save.status === 200, `status=${save.status} body=${save.text}`);
        const get = await req('GET', '/api/settings', undefined, token2);
        check('GET settings 成功', get.status === 200, `status=${get.status}`);
        check('敏感字段只返回 configured，不返回原值',
            get.json && get.json.telegram_token && get.json.telegram_token.configured === true && !get.text.includes(secret),
            `body=${get.text}`);
        check('非敏感字段正常返回值', get.json && get.json.timezone === 'Asia/Shanghai', `body=${get.text}`);
        const bad = await req('POST', '/api/settings', { not_a_real_key: 'x' }, token2);
        check('未知 key 写入返回 400', bad.status === 400, `status=${bad.status} body=${bad.text}`);
        const get2 = await req('GET', '/api/settings', undefined, token2);
        check('未知 key 未被写入', !('not_a_real_key' in (get2.json || {})), `body=${get2.text}`);
        check('未登录访问 settings 返回 401', (await req('GET', '/api/settings')).status === 401);
    } finally {
        await new Promise((r) => server.close(r));
    }

    console.log = origLog;
    console.log(`\n结果：${passed} 通过，${failed} 失败（临时库：${tmpDir}）`);
    db.close(() => {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) { /* ignore */ }
        process.exit(failed === 0 ? 0 : 1);
    });
}

main().catch((err) => {
    console.log = origLog;
    console.error('测试异常：', err);
    try { db.close(() => process.exit(1)); } catch (_) { process.exit(1); }
});
