const http = require('http');

console.log('----------------------------------------');
console.log('DEBUG SERVER STARTING...');
console.log('Node Version:', process.version);
console.log('Platform:', process.platform);
console.log('Arch:', process.arch);
console.log('----------------------------------------');

// Capture signals
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.on(signal, () => {
        console.log(`Received ${signal}, shutting down...`);
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Zeabur Debug Server is RUNNING!');
});

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Debug server listening on 0.0.0.0:${PORT}`);
});

// Keep process alive and log heartbeat
setInterval(() => {
    console.log(`[${new Date().toISOString()}] Heartbeat - Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
}, 5000);
