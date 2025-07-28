import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../index';
import { createStorage } from '../storage';

describe('Authentication Routes', () => {
  let app: any;
  let server: any;

  beforeAll(async () => {
    // Create test app instance
    const storage = createStorage();
    server = await createApp(storage);
    app = server;
  });

  afterAll(async () => {
    if (server && typeof server.close === 'function') {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const userData = {
        username: 'testuser123',
        password: 'password123',
        portfolioName: 'Test Portfolio'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser123');
      expect(response.body.user.portfolioName).toBe('Test Portfolio');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    test('should reject registration with invalid data', async () => {
      const userData = {
        username: '',
        password: '123', // too short
        portfolioName: 'Test Portfolio'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('validation');
    });

    test('should reject duplicate username', async () => {
      const userData = {
        username: 'duplicate',
        password: 'password123',
        portfolioName: 'First Portfolio'
      };

      // First registration should succeed
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same username should fail
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'loginuser',
          password: 'password123',
          portfolioName: 'Login Portfolio'
        });
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('loginuser');
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid');
    });

    test('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return user info when authenticated', async () => {
      // First login to get session
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        });

      // Extract session cookie
      const sessionCookie = loginResponse.headers['set-cookie'];

      // Test authenticated endpoint
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('loginuser');
    });

    test('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        });

      const sessionCookie = loginResponse.headers['set-cookie'];

      // Then logout
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', sessionCookie)
        .expect(200);

      // Verify session is destroyed
      await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie)
        .expect(401);
    });
  });
});