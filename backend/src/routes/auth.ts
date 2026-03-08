/**
 * Authentication API Routes
 * 
 * Handles user registration, login, and profile retrieval
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Register a new user account
 * 
 * Requirements: 1.1
 * Property 1: User Registration Creates Complete Records
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required field: name, email, or password' 
      });
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Name must be a non-empty string' 
      });
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user record
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: hashedPassword,
        created_at: new Date().toISOString()
      })
      .select('id, name, email, created_at')
      .single();

    if (insertError || !newUser) {
      console.error('User registration error:', insertError);
      return res.status(500).json({ 
        error: 'Failed to create user account' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      userId: newUser.id,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during registration' 
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and establish session
 * 
 * Requirements: 1.2, 1.4
 * Property 2: Authentication Round Trip
 * Property 3: Invalid Credentials Produce Safe Errors
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required field: email or password' 
      });
    }

    // Retrieve user with password hash
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('id, name, email, password_hash, created_at')
      .eq('email', email.toLowerCase().trim())
      .single();

    // Return generic error message for security (don't reveal if email exists)
    if (queryError || !user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      userId: user.id,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during login' 
    });
  }
});

/**
 * GET /api/auth/profile
 * Retrieve authenticated user's profile
 * 
 * Requirements: 1.3
 * Property 2: Authentication Round Trip
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ 
        error: 'Session expired, please log in again' 
      });
    }

    // Retrieve user from database
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', decoded.userId)
      .single();

    if (queryError || !user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

export default router;
