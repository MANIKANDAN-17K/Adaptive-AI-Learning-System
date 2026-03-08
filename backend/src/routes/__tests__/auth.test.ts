/**
 * Authentication API Routes Tests
 * 
 * Unit tests for authentication endpoints
 */

import request from 'supertest';
import express from 'express';
import authRoutes from '../auth';
import { supabase } from '../../db';

// Mock the database
jest.mock('../../db', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Create a test app without starting the server
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required field');
    });

    it('should reject registration with empty name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ 
          name: '   ', 
          email: 'test@example.com', 
          password: 'password123' 
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Name must be a non-empty string');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ 
          name: 'Test User', 
          email: 'invalid-email', 
          password: 'password123' 
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid email format');
    });

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ 
          name: 'Test User', 
          email: 'test@example.com', 
          password: '12345' 
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Password must be at least 6 characters');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required field');
    });

    it('should return generic error for non-existent user', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          })
        })
      });

      (supabase.from as jest.Mock) = mockFrom;

      const response = await request(app)
        .post('/api/auth/login')
        .send({ 
          email: 'nonexistent@example.com', 
          password: 'password123' 
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should reject request without authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject request with invalid token format', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidToken');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });
  });
});
