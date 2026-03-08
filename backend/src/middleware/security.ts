/**
 * Security Middleware
 * 
 * Ensures responses never contain environment variables or API keys.
 * 
 * Requirements: 10.2, 19.2
 * Property 34: API Key Exclusion from Responses
 */

import { Request, Response, NextFunction } from 'express';

/**
 * List of sensitive patterns to check for in responses
 */
const SENSITIVE_PATTERNS = [
  /AKIA[0-9A-Z]{16}/gi,  // AWS Access Key IDs
  /AWS_ACCESS_KEY_ID/gi,
  /AWS_SECRET_ACCESS_KEY/gi,
  /BEDROCK_MODEL_ID/gi,
  /JWT_SECRET/gi,
  /SUPABASE_URL/gi,
  /SUPABASE_KEY/gi,
  /SUPABASE_SERVICE_KEY/gi,
  /DATABASE_URL/gi,
  /password/gi,
  /secret/gi,
  /api[_-]?key/gi,
  /access[_-]?token/gi,
  /private[_-]?key/gi
];

/**
 * Recursively scans an object for sensitive data
 */
function containsSensitiveData(obj: any, depth: number = 0): boolean {
  // Prevent infinite recursion
  if (depth > 10) return false;

  if (typeof obj === 'string') {
    // Check if string matches any sensitive pattern
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(obj));
  }

  if (Array.isArray(obj)) {
    return obj.some(item => containsSensitiveData(item, depth + 1));
  }

  if (obj !== null && typeof obj === 'object') {
    // Check object keys and values
    for (const [key, value] of Object.entries(obj)) {
      // Check if key name is sensitive
      if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
        return true;
      }
      // Recursively check value
      if (containsSensitiveData(value, depth + 1)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Middleware to sanitize responses and prevent API key leakage
 */
export const sanitizeResponse = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to intercept responses
  res.json = function (body: any): Response {
    // Check if response contains sensitive data
    if (containsSensitiveData(body)) {
      console.error('SECURITY ALERT: Attempted to send sensitive data in response', {
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      // Return error instead of exposing sensitive data
      return originalJson({
        error: 'Internal server error',
        message: 'Response contains sensitive information and was blocked'
      });
    }

    // If safe, send original response
    return originalJson(body);
  };

  next();
};

/**
 * Middleware to add security headers to responses
 */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Strict transport security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};
