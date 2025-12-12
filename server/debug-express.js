const express = require('express');
const app = express();

console.log('DEBUG EXPRESS SERVER STARTING...');

app.get('/', (req, res) => {
    console.log('GET / request received');
    res.send('Express Debug Server is RUNNING!');
});

const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express Debug server listening on 0.0.0.0:${PORT}`);
    console.log('Try accessing the URL now.');
});

// Heartbeat to keep logs active
setInterval(() => {
    console.log(`[${new Date().toISOString()}] Heartbeat - Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
}, 5000);
