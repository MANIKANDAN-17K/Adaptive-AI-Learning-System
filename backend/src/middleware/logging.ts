/**
 * Logging Middleware
 * 
 * Logs unauthorized access attempts and other security events.
 * 
 * Requirements: 10.5, 19.5
 * Property 37: Unauthorized Access Rejection and Logging
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Interface for unauthorized access log entry
 */
interface UnauthorizedAccessLog {
  timestamp: string;
  ip: string;
  method: string;
  path: string;
  userAgent?: string;
  reason: string;
}

/**
 * In-memory store for unauthorized access attempts
 * In production, this should be persisted to a database or logging service
 */
const unauthorizedAccessLogs: UnauthorizedAccessLog[] = [];

/**
 * Logs an unauthorized access attempt
 */
export function logUnauthorizedAccess(
  req: Request,
  reason: string
): void {
  const logEntry: UnauthorizedAccessLog = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    reason
  };

  unauthorizedAccessLogs.push(logEntry);

  // Log to console for immediate visibility
  console.warn('UNAUTHORIZED ACCESS ATTEMPT:', {
    ...logEntry,
    headers: {
      authorization: req.headers.authorization ? '[REDACTED]' : 'none'
    }
  });

  // In production, you would also:
  // - Send to a logging service (e.g., CloudWatch, Datadog)
  // - Store in database for audit trail
  // - Trigger alerts if threshold exceeded
}

/**
 * Gets all unauthorized access logs
 * This is useful for security audits and monitoring
 */
export function getUnauthorizedAccessLogs(): UnauthorizedAccessLog[] {
  return [...unauthorizedAccessLogs];
}

/**
 * Clears unauthorized access logs
 * Useful for testing or periodic cleanup
 */
export function clearUnauthorizedAccessLogs(): void {
  unauthorizedAccessLogs.length = 0;
}

/**
 * Middleware that logs all requests for audit purposes
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent']
    };

    // Log unauthorized attempts (4xx status codes)
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn('Unauthorized request:', logData);
    } else {
      console.log('Request:', logData);
    }
  });

  next();
};

/**
 * Enhanced authentication middleware with logging
 * This wraps the standard auth middleware to add logging
 */
export const authenticateWithLogging = (
  authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Store original res.status and res.json to intercept auth failures
    const originalStatus = res.status.bind(res);
    const originalJson = res.json.bind(res);

    let statusCode: number | undefined;

    // Override status to capture status code
    res.status = function (code: number): Response {
      statusCode = code;
      return originalStatus(code);
    };

    // Override json to capture response and log if unauthorized
    res.json = function (body: any): Response {
      // Log unauthorized access attempts
      if (statusCode === 401 || statusCode === 403) {
        const reason = body?.error || 'Authentication failed';
        logUnauthorizedAccess(req, reason);
      }

      return originalJson(body);
    };

    // Call the actual auth middleware
    authMiddleware(req, res, next);
  };
};
