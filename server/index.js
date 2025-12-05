const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
// Zeabur uses WEB_PORT, other platforms use PORT
const PORT = process.env.WEB_PORT || process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');
const settingsRoutes = require('./routes/settings');

app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/settings', settingsRoutes);

// API Routes Placeholder
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'LaoWang Subscription API is running' });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

const { startCronJob } = require('./cron/checker');
startCronJob();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
