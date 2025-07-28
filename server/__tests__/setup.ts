import { beforeAll, afterAll, beforeEach } from '@jest/globals';

// Test database setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/portfolio_test';
  process.env.SESSION_SECRET = 'test-secret';
});

afterAll(async () => {
  // Cleanup after all tests
});

beforeEach(() => {
  // Reset any global state before each test
});