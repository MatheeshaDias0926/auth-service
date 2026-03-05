/**
 * Global error handling middleware.
 * Catches all unhandled errors and returns a consistent response.
 */
const errorHandler = (err, _req, res, _next) => {
    console.error('Error:', err.message); // eslint-disable-line no-console

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: messages,
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            success: false,
            message: `An account with this ${field} already exists.`,
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token.',
        });
    }

    // Default server error
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
};

module.exports = errorHandler;
