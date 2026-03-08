/**
 * Input Validation Middleware
 * 
 * Validates request bodies before processing to ensure data integrity.
 * 
 * Requirements: 17.4
 * Property 52: Input Validation Before Processing
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Validation schema type
 */
export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
  };
}

/**
 * Creates a validation middleware for the given schema
 */
export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // Check required fields
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`Missing required field: ${field}`);
        continue;
      }

      // Skip validation if field is not required and not provided
      if (!rules.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push(`Field ${field} must be of type ${rules.type}`);
          continue;
        }
      }

      // String validations
      if (rules.type === 'string' && typeof value === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push(`Field ${field} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push(`Field ${field} must be at most ${rules.maxLength} characters`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`Field ${field} has invalid format`);
        }
      }

      // Number validations
      if (rules.type === 'number' && typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`Field ${field} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`Field ${field} must be at most ${rules.max}`);
        }
      }

      // Custom validation
      if (rules.custom) {
        const result = rules.custom(value);
        if (result !== true) {
          errors.push(typeof result === 'string' ? result : `Field ${field} failed validation`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ 
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    next();
  };
};

/**
 * Common validation schemas
 */
export const validationSchemas = {
  skillCreation: {
    skillName: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      custom: (value: string) => {
        if (value.trim().length === 0) {
          return 'Skill name cannot be empty or whitespace only';
        }
        return true;
      }
    },
    goal: {
      required: true,
      type: 'string' as const,
      minLength: 1
    },
    timeline: {
      required: true,
      type: 'number' as const,
      min: 1,
      custom: (value: number) => {
        if (!Number.isInteger(value)) {
          return 'Timeline must be a positive integer';
        }
        return true;
      }
    }
  },

  sessionInteraction: {
    userInput: {
      required: true,
      type: 'string' as const,
      minLength: 1
    },
    accuracy: {
      required: true,
      type: 'number' as const,
      min: 0,
      max: 100
    },
    speed: {
      required: true,
      type: 'number' as const,
      min: 0,
      max: 100
    },
    attempts: {
      required: true,
      type: 'number' as const,
      min: 1,
      custom: (value: number) => {
        if (!Number.isInteger(value)) {
          return 'Attempts must be a positive integer';
        }
        return true;
      }
    }
  },

  sessionEnd: {
    recapSummary: {
      required: true,
      type: 'string' as const,
      minLength: 1
    }
  },

  characterAnalysis: {
    userId: {
      required: true,
      type: 'string' as const,
      minLength: 1
    },
    responses: {
      required: true,
      type: 'array' as const
    }
  },

  roadmapGeneration: {
    skillId: {
      required: true,
      type: 'string' as const,
      minLength: 1
    },
    skillName: {
      required: true,
      type: 'string' as const,
      minLength: 1
    },
    goal: {
      required: true,
      type: 'string' as const,
      minLength: 1
    },
    timeline: {
      required: true,
      type: 'number' as const,
      min: 1
    },
    profile: {
      required: true,
      type: 'object' as const
    }
  }
};
