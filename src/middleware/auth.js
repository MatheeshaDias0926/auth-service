const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT tokens.
 * Extracts the token from the Authorization header,
 * verifies it, and attaches the user to the request.
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret);

        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found or inactive.',
            });
        }

        req.user = {
            userId: user._id,
            email: user.email,
            studentId: user.studentId,
            role: user.role,
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.',
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.',
            });
        }
        next(error);
    }
};

/**
 * Middleware to authorize based on roles.
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.',
            });
        }
        next();
    };
};

module.exports = { authenticate, authorize };
