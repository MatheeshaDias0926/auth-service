const Joi = require('joi');

/**
 * Validation schemas for auth endpoints using Joi.
 */

const registerSchema = Joi.object({
    firstName: Joi.string().trim().max(50).required().messages({
        'string.empty': 'First name is required',
        'string.max': 'First name cannot exceed 50 characters',
    }),
    lastName: Joi.string().trim().max(50).required().messages({
        'string.empty': 'Last name is required',
        'string.max': 'Last name cannot exceed 50 characters',
    }),
    email: Joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
    }),
    studentId: Joi.string().trim().required().messages({
        'string.empty': 'Student ID is required',
    }),
    password: Joi.string().min(8).max(128).required().messages({
        'string.min': 'Password must be at least 8 characters',
        'string.max': 'Password cannot exceed 128 characters',
        'string.empty': 'Password is required',
    }),
});

const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required',
    }),
});

const updateProfileSchema = Joi.object({
    firstName: Joi.string().trim().max(50),
    lastName: Joi.string().trim().max(50),
}).min(1).messages({
    'object.min': 'At least one field must be provided for update',
});

/**
 * Middleware factory that validates request body against a Joi schema.
 * @param {Joi.ObjectSchema} schema
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const messages = error.details.map((detail) => detail.message);
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: messages,
            });
        }

        req.body = value;
        next();
    };
};

module.exports = {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    validate,
};
