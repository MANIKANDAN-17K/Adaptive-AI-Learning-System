/**
 * Error Handling Middleware
 * 
 * Centralized error handling for database failures, AI service errors,
 * validation errors, and other exceptions.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 * Property 42: Database Failure Error Handling
 * Property 43: AI Service Unavailability Handling
 * Property 44: Invalid Input Error Messages
 * Property 45: Session Interruption State Preservation
 * Property 46: Error Logging and User Messages
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Database error handler
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(503, message);
  }
}

/**
 * AI Service error handler
 */
export class AIServiceError extends AppError {
  constructor(message: string = 'AI service temporarily unavailable') {
    super(503, message);
  }
}

/**
 * Validation error handler
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

/**
 * Resource not found error handler
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}

/**
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handles Supabase database errors
 */
export function handleDatabaseError(error: any): AppError {
  console.error('Database error:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    timestamp: new Date().toISOString()
  });

  // Connection errors
  if (error.message?.includes('connection') || error.code === 'ECONNREFUSED') {
    return new DatabaseError('Service temporarily unavailable, please try again');
  }

  // Timeout errors
  if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
    return new DatabaseError('Request timeout, please try again');
  }

  // Constraint violations
  if (error.code === '23505') { // Unique constraint violation
    return new AppError(409, 'Operation conflicts with existing data');
  }

  if (error.code === '23503') { // Foreign key violation
    return new AppError(409, 'Operation conflicts with existing data');
  }

  // Generic database error
  return new DatabaseError('Service temporarily unavailable, please try again');
}

/**
 * Handles AI service errors
 */
export function handleAIServiceError(error: any): AppError {
  console.error('AI Service error:', {
    message: error.message,
    status: error.status,
    timestamp: new Date().toISOString()
  });

  // Rate limiting
  if (error.status === 429 || error.message?.includes('rate limit')) {
    return new AppError(429, 'Too many requests, please wait before retrying');
  }

  // API unavailable
  if (error.status === 503 || error.message?.includes('unavailable')) {
    return new AIServiceError('AI service temporarily unavailable');
  }

  // Invalid API response
  if (error.message?.includes('parse') || error.message?.includes('JSON')) {
    return new AppError(502, 'Unable to process AI response');
  }

  // Generic AI service error
  return new AIServiceError('AI service temporarily unavailable');
}

/**
 * Global error handling middleware
 * This should be the last middleware in the chain
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default to 500 server error
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Log error details for debugging
  console.error('Error occurred:', {
    statusCode,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    isOperational
  });

  // Send user-friendly error response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack
    })
  });
};

/**
 * Handles 404 errors for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
};
