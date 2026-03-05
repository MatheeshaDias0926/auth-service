const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { app } = require('../src/app');
const User = require('../src/models/User');
const config = require('../src/config');

// Mock the database connection
jest.mock('../src/config/database', () => jest.fn());

// Use in-memory MongoDB for testing
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
});

describe('Auth Service API', () => {
    // =============================================
    // Health Check
    // =============================================
    describe('GET /health', () => {
        it('should return health status', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.service).toBe('auth-service');
            expect(res.body.status).toBe('healthy');
        });
    });

    // =============================================
    // Registration
    // =============================================
    describe('POST /auth/register', () => {
        const validUser = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@campus.edu',
            studentId: 'IT20123456',
            password: 'SecurePass123',
        };

        it('should register a new user successfully', async () => {
            const res = await request(app).post('/auth/register').send(validUser);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(validUser.email);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
            expect(res.body.data.user.password).toBeUndefined();
        });

        it('should return 409 for duplicate email', async () => {
            await request(app).post('/auth/register').send(validUser);
            const res = await request(app).post('/auth/register').send(validUser);

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 for missing required fields', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ email: 'test@test.com' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
        });

        it('should return 400 for invalid email format', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ ...validUser, email: 'not-an-email' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 for short password', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ ...validUser, password: '123' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    // =============================================
    // Login
    // =============================================
    describe('POST /auth/login', () => {
        beforeEach(async () => {
            await request(app).post('/auth/register').send({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@campus.edu',
                studentId: 'IT20123456',
                password: 'SecurePass123',
            });
        });

        it('should login with valid credentials', async () => {
            const res = await request(app).post('/auth/login').send({
                email: 'john.doe@campus.edu',
                password: 'SecurePass123',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
        });

        it('should return 401 for wrong password', async () => {
            const res = await request(app).post('/auth/login').send({
                email: 'john.doe@campus.edu',
                password: 'WrongPassword',
            });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should return 401 for non-existent email', async () => {
            const res = await request(app).post('/auth/login').send({
                email: 'nobody@campus.edu',
                password: 'SecurePass123',
            });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    // =============================================
    // Profile
    // =============================================
    describe('GET /auth/profile', () => {
        let accessToken;

        beforeEach(async () => {
            const res = await request(app).post('/auth/register').send({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@campus.edu',
                studentId: 'IT20123456',
                password: 'SecurePass123',
            });
            accessToken = res.body.data.accessToken;
        });

        it('should return profile with valid token', async () => {
            const res = await request(app)
                .get('/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe('john.doe@campus.edu');
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/auth/profile');
            expect(res.status).toBe(401);
        });

        it('should return 401 with invalid token', async () => {
            const res = await request(app)
                .get('/auth/profile')
                .set('Authorization', 'Bearer invalid-token');
            expect(res.status).toBe(401);
        });
    });

    // =============================================
    // Update Profile
    // =============================================
    describe('PUT /auth/profile', () => {
        let accessToken;

        beforeEach(async () => {
            const res = await request(app).post('/auth/register').send({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@campus.edu',
                studentId: 'IT20123456',
                password: 'SecurePass123',
            });
            accessToken = res.body.data.accessToken;
        });

        it('should update profile successfully', async () => {
            const res = await request(app)
                .put('/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ firstName: 'Jane' });

            expect(res.status).toBe(200);
            expect(res.body.data.user.firstName).toBe('Jane');
        });

        it('should return 400 for empty update', async () => {
            const res = await request(app)
                .put('/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({});

            expect(res.status).toBe(400);
        });
    });

    // =============================================
    // Token Refresh
    // =============================================
    describe('POST /auth/refresh', () => {
        let refreshToken;

        beforeEach(async () => {
            const res = await request(app).post('/auth/register').send({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@campus.edu',
                studentId: 'IT20123456',
                password: 'SecurePass123',
            });
            refreshToken = res.body.data.refreshToken;
        });

        it('should refresh token successfully', async () => {
            const res = await request(app)
                .post('/auth/refresh')
                .send({ refreshToken });

            expect(res.status).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
        });

        it('should return 400 without refresh token', async () => {
            const res = await request(app).post('/auth/refresh').send({});
            expect(res.status).toBe(400);
        });

        it('should return 401 with invalid refresh token', async () => {
            const res = await request(app)
                .post('/auth/refresh')
                .send({ refreshToken: 'invalid-token' });
            expect(res.status).toBe(401);
        });
    });

    // =============================================
    // Token Validation (Inter-Service)
    // =============================================
    describe('GET /auth/validate', () => {
        let accessToken;

        beforeEach(async () => {
            const res = await request(app).post('/auth/register').send({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@campus.edu',
                studentId: 'IT20123456',
                password: 'SecurePass123',
            });
            accessToken = res.body.data.accessToken;
        });

        it('should validate a valid token', async () => {
            const res = await request(app)
                .get('/auth/validate')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.valid).toBe(true);
            expect(res.body.data.email).toBe('john.doe@campus.edu');
        });

        it('should reject an expired token', async () => {
            const expiredToken = jwt.sign({ userId: 'test' }, config.jwt.secret, {
                expiresIn: '0s',
            });

            const res = await request(app)
                .get('/auth/validate')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(res.status).toBe(401);
        });
    });

    // =============================================
    // 404 Handler
    // =============================================
    describe('404 Handler', () => {
        it('should return 404 for unknown routes', async () => {
            const res = await request(app).get('/non-existent-route');
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });
});
