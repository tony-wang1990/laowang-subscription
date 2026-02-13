const crypto = require('crypto');

// Use environment variable or generate a secure random one for this session
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not set. Using a random secret. Tokens will be invalidated upon server restart.');
}

module.exports = {
    JWT_SECRET
};
