/**
 * Response Formatting Middleware
 * 
 * Ensures all API responses include appropriate HTTP status codes and valid JSON.
 * 
 * Requirements: 17.5
 * Property 53: HTTP Response Format
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure consistent response formatting
 * Intercepts res.json() to add metadata and ensure proper structure
 */
export const formatResponse = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to add formatting
  res.json = function (body: any): Response {
    // Ensure we have a status code set
    if (!res.statusCode) {
      res.status(200);
    }

    // Validate that body is JSON-serializable
    try {
      JSON.stringify(body);
    } catch (error) {
      console.error('Response body is not JSON-serializable:', error);
      res.status(500);
      return originalJson({
        error: 'Internal server error',
        message: 'Invalid response format'
      });
    }

    // Add metadata for successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const formattedBody = {
        success: true,
        data: body,
        timestamp: new Date().toISOString()
      };
      return originalJson(formattedBody);
    }

    // For error responses, ensure consistent structure
    if (res.statusCode >= 400) {
      // If body already has error structure, use it
      if (body && typeof body === 'object' && 'error' in body) {
        return originalJson({
          success: false,
          ...body,
          timestamp: new Date().toISOString()
        });
      }

      // Otherwise, wrap in error structure
      return originalJson({
        success: false,
        error: body || 'An error occurred',
        timestamp: new Date().toISOString()
      });
    }

    // For other status codes, send as-is
    return originalJson(body);
  };

  next();
};

/**
 * Middleware to set appropriate content-type headers
 */
export const setContentType = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set default content type to JSON
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
};

/**
 * Middleware to validate response status codes
 * Ensures status codes are valid HTTP codes
 */
export const validateStatusCode = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Store original status method
  const originalStatus = res.status.bind(res);

  // Override status method to validate
  res.status = function (code: number): Response {
    // Validate status code is a valid HTTP code
    if (!Number.isInteger(code) || code < 100 || code > 599) {
      console.error(`Invalid HTTP status code: ${code}`);
      return originalStatus(500);
    }

    return originalStatus(code);
  };

  next();
};
