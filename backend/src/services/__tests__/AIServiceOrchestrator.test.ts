/**
 * Unit tests for AIServiceOrchestrator
 */

import { AIServiceOrchestrator } from '../AIServiceOrchestrator';

describe('AIServiceOrchestrator', () => {
  describe('constructor', () => {
    it('should initialize successfully', () => {
      const orchestrator = new AIServiceOrchestrator();
      expect(orchestrator).toBeInstanceOf(AIServiceOrchestrator);
    });

    it('should initialize with AWS Bedrock service', () => {
      // Set required environment variables
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
      process.env.AWS_REGION = 'us-east-1';
      process.env.BEDROCK_MODEL_ID = 'meta.llama4-scout-17b-instruct-v1:0';
      
      const orchestrator = new AIServiceOrchestrator();
      expect(orchestrator).toBeInstanceOf(AIServiceOrchestrator);
      
      // Cleanup
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.AWS_REGION;
      delete process.env.BEDROCK_MODEL_ID;
    });
  });

  describe('method signatures', () => {
    let orchestrator: AIServiceOrchestrator;

    beforeEach(() => {
      // Set required environment variables for tests
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
      process.env.AWS_REGION = 'us-east-1';
      process.env.BEDROCK_MODEL_ID = 'meta.llama4-scout-17b-instruct-v1:0';
      
      orchestrator = new AIServiceOrchestrator();
    });

    afterEach(() => {
      // Cleanup
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.AWS_REGION;
      delete process.env.BEDROCK_MODEL_ID;
    });

    it('should have generateRoadmap method', () => {
      expect(typeof orchestrator.generateRoadmap).toBe('function');
    });

    it('should have conductCharacterAnalysis method', () => {
      expect(typeof orchestrator.conductCharacterAnalysis).toBe('function');
    });

    it('should have generateRecap method', () => {
      expect(typeof orchestrator.generateRecap).toBe('function');
    });

    it('should have generateMentorResponse method', () => {
      expect(typeof orchestrator.generateMentorResponse).toBe('function');
    });

    it('should have generateStretchTask method', () => {
      expect(typeof orchestrator.generateStretchTask).toBe('function');
    });
  });
});
