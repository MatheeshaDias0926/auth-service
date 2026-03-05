const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-service',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:3000'],
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    },
};
