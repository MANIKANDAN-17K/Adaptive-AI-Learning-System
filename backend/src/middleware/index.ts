/**
 * Middleware Index
 * 
 * Central export point for all middleware functions
 */

export { authenticateToken, AuthenticatedRequest } from './auth';
export { validateRequest, validationSchemas, ValidationSchema } from './validation';
export { sanitizeResponse, securityHeaders } from './security';
export {
  logUnauthorizedAccess,
  getUnauthorizedAccessLogs,
  clearUnauthorizedAccessLogs,
  requestLogger,
  authenticateWithLogging
} from './logging';
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  DatabaseError,
  AIServiceError,
  ValidationError,
  NotFoundError,
  handleDatabaseError,
  handleAIServiceError
} from './errorHandler';
export {
  formatResponse,
  setContentType,
  validateStatusCode
} from './responseFormatter';
