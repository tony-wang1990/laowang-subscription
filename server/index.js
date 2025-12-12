console.log('Starting application...');
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, p) => {
    console.error('UNHANDLED REJECTION:', reason);
    process.exit(1);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
// Zeabur uses WEB_PORT, other platforms use PORT
const PORT = process.env.WEB_PORT || process.env.PORT || 8080;

try {
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Loading modules...');

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Routes
    console.log('Loading routes...');
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

    console.log('Loading cron jobs...');
    const { startCronJob } = require('./cron/checker');
    startCronJob();

    console.log(`Attempting to bind port ${PORT}...`);
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });

} catch (err) {
    console.error('FATAL ERROR DURING STARTUP:', err);
    console.error(err.stack);
    process.exit(1);
}
