const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

/**
 * Generate access and refresh tokens for a user.
 */
const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
    const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
    });
    return { accessToken, refreshToken };
};

/**
 * POST /auth/register
 * Register a new student account.
 */
const register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, studentId, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { studentId }],
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    existingUser.email === email
                        ? 'Email already registered'
                        : 'Student ID already registered',
            });
        }

        // Create new user
        const user = await User.create({
            firstName,
            lastName,
            email,
            studentId,
            password,
        });

        const tokens = generateTokens(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    studentId: user.studentId,
                    role: user.role,
                },
                ...tokens,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /auth/login
 * Authenticate user and return tokens.
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user and include password for comparison
        const user = await User.findOne({ email }).select('+password');

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        const tokens = generateTokens(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    studentId: user.studentId,
                    role: user.role,
                },
                ...tokens,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /auth/profile
 * Get the authenticated user's profile.
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /auth/profile
 * Update the authenticated user's profile.
 */
const updateProfile = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /auth/refresh
 * Refresh the access token using a valid refresh token.
 */
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required',
            });
        }

        const decoded = jwt.verify(token, config.jwt.refreshSecret);
        const user = await User.findById(decoded.userId);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token',
            });
        }

        const tokens = generateTokens(user._id);

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: tokens,
        });
    } catch (error) {
        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError'
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token',
            });
        }
        next(error);
    }
};

/**
 * GET /auth/validate
 * Validate a JWT token — used by other microservices to verify tokens.
 */
const validateToken = async (req, res, next) => {
    try {
        // Token is already validated by auth middleware
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                valid: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            valid: true,
            data: {
                userId: user._id,
                email: user.email,
                studentId: user.studentId,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    refreshToken,
    validateToken,
    generateTokens,
};
