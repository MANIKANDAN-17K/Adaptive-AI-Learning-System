/**
 * Unit tests for core data models and types
 * 
 * These tests verify that all type definitions are correctly structured
 * and can be instantiated with valid data.
 */

import {
  User,
  PersonalityProfile,
  Skill,
  Roadmap,
  RoadmapNode,
  Session,
  PerformanceLog,
  MentorMode,
  Message,
  Task,
  SessionContext,
} from '../types';

describe('Core Data Models and Types', () => {
  describe('User', () => {
    it('should create a valid User object', () => {
      const user: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        created_at: new Date(),
      };

      expect(user.id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.created_at).toBeInstanceOf(Date);
    });
  });

  describe('PersonalityProfile', () => {
    it('should create a valid PersonalityProfile object', () => {
      const profile: PersonalityProfile = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        tone_type: 'friendly',
        confidence_level: 'medium',
        motivation_index: 75,
      };

      expect(profile.user_id).toBeDefined();
      expect(profile.tone_type).toBe('friendly');
      expect(profile.confidence_level).toBe('medium');
      expect(profile.motivation_index).toBe(75);
    });
  });

  describe('Skill', () => {
    it('should create a valid Skill object', () => {
      const skill: Skill = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        skill_name: 'TypeScript',
        goal: 'Master TypeScript for backend development',
        timeline: 30,
        created_at: new Date(),
      };

      expect(skill.id).toBeDefined();
      expect(skill.user_id).toBeDefined();
      expect(skill.skill_name).toBe('TypeScript');
      expect(skill.goal).toBe('Master TypeScript for backend development');
      expect(skill.timeline).toBe(30);
      expect(skill.created_at).toBeInstanceOf(Date);
    });
  });

  describe('RoadmapNode', () => {
    it('should create a valid RoadmapNode object', () => {
      const node: RoadmapNode = {
        node_id: 'node-1',
        title: 'Introduction to TypeScript',
        description: 'Learn the basics of TypeScript',
        mastery_threshold: 70,
        status: 'current',
        order: 1,
      };

      expect(node.node_id).toBe('node-1');
      expect(node.title).toBe('Introduction to TypeScript');
      expect(node.description).toBe('Learn the basics of TypeScript');
      expect(node.mastery_threshold).toBe(70);
      expect(node.status).toBe('current');
      expect(node.order).toBe(1);
    });

    it('should accept all valid status values', () => {
      const statuses: Array<'locked' | 'current' | 'completed'> = ['locked', 'current', 'completed'];
      
      statuses.forEach(status => {
        const node: RoadmapNode = {
          node_id: 'node-1',
          title: 'Test Node',
          description: 'Test Description',
          mastery_threshold: 70,
          status,
          order: 1,
        };
        expect(node.status).toBe(status);
      });
    });
  });

  describe('Roadmap', () => {
    it('should create a valid Roadmap object', () => {
      const nodes: RoadmapNode[] = [
        {
          node_id: 'node-1',
          title: 'Node 1',
          description: 'First node',
          mastery_threshold: 70,
          status: 'current',
          order: 1,
        },
        {
          node_id: 'node-2',
          title: 'Node 2',
          description: 'Second node',
          mastery_threshold: 75,
          status: 'locked',
          order: 2,
        },
      ];

      const roadmap: Roadmap = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        skill_id: '123e4567-e89b-12d3-a456-426614174001',
        structure_json: nodes,
        mastery_threshold: 70,
      };

      expect(roadmap.id).toBeDefined();
      expect(roadmap.skill_id).toBeDefined();
      expect(roadmap.structure_json).toHaveLength(2);
      expect(roadmap.mastery_threshold).toBe(70);
    });
  });

  describe('Session', () => {
    it('should create a valid Session object', () => {
      const session: Session = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        skill_id: '123e4567-e89b-12d3-a456-426614174001',
        recap_summary: 'Last session covered TypeScript basics',
        mastery_score: 75.5,
        confidence_level: 'high',
        last_activity: new Date(),
      };

      expect(session.id).toBeDefined();
      expect(session.skill_id).toBeDefined();
      expect(session.recap_summary).toBe('Last session covered TypeScript basics');
      expect(session.mastery_score).toBe(75.5);
      expect(session.confidence_level).toBe('high');
      expect(session.last_activity).toBeInstanceOf(Date);
    });
  });

  describe('PerformanceLog', () => {
    it('should create a valid PerformanceLog object', () => {
      const log: PerformanceLog = {
        session_id: '123e4567-e89b-12d3-a456-426614174003',
        accuracy: 85.5,
        speed: 90.0,
        attempts: 2,
        timestamp: new Date(),
      };

      expect(log.session_id).toBeDefined();
      expect(log.accuracy).toBe(85.5);
      expect(log.speed).toBe(90.0);
      expect(log.attempts).toBe(2);
      expect(log.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('MentorMode', () => {
    it('should accept all valid MentorMode values', () => {
      const modes: MentorMode[] = ['Professional', 'Friendly', 'Supportive', 'Challenger'];
      
      modes.forEach(mode => {
        const mentorMode: MentorMode = mode;
        expect(mentorMode).toBe(mode);
      });
    });
  });

  describe('Message', () => {
    it('should create a valid Message object from user', () => {
      const message: Message = {
        id: 'msg-1',
        sender: 'user',
        content: 'Hello, I need help with TypeScript',
        timestamp: new Date(),
      };

      expect(message.id).toBe('msg-1');
      expect(message.sender).toBe('user');
      expect(message.content).toBe('Hello, I need help with TypeScript');
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('should create a valid Message object from mentor', () => {
      const message: Message = {
        id: 'msg-2',
        sender: 'mentor',
        content: 'Sure, I can help you with that!',
        timestamp: new Date(),
      };

      expect(message.id).toBe('msg-2');
      expect(message.sender).toBe('mentor');
      expect(message.content).toBe('Sure, I can help you with that!');
      expect(message.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Task', () => {
    it('should create a valid regular Task object', () => {
      const task: Task = {
        id: 'task-1',
        description: 'Complete the TypeScript basics module',
        isStretch: false,
      };

      expect(task.id).toBe('task-1');
      expect(task.description).toBe('Complete the TypeScript basics module');
      expect(task.isStretch).toBe(false);
    });

    it('should create a valid stretch Task object', () => {
      const task: Task = {
        id: 'task-2',
        description: 'Build a complex TypeScript application',
        isStretch: true,
      };

      expect(task.id).toBe('task-2');
      expect(task.description).toBe('Build a complex TypeScript application');
      expect(task.isStretch).toBe(true);
    });
  });

  describe('SessionContext', () => {
    it('should create a valid SessionContext object', () => {
      const skill: Skill = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        skill_name: 'TypeScript',
        goal: 'Master TypeScript',
        timeline: 30,
        created_at: new Date(),
      };

      const currentNode: RoadmapNode = {
        node_id: 'node-1',
        title: 'Introduction',
        description: 'Learn the basics',
        mastery_threshold: 70,
        status: 'current',
        order: 1,
      };

      const performanceHistory: PerformanceLog[] = [
        {
          session_id: '123e4567-e89b-12d3-a456-426614174003',
          accuracy: 85.5,
          speed: 90.0,
          attempts: 2,
          timestamp: new Date(),
        },
      ];

      const personalityProfile: PersonalityProfile = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        tone_type: 'friendly',
        confidence_level: 'medium',
        motivation_index: 75,
      };

      const context: SessionContext = {
        skill,
        currentNode,
        masteryScore: 87.5,
        confidenceLevel: 'high',
        performanceHistory,
        personalityProfile,
      };

      expect(context.skill).toBe(skill);
      expect(context.currentNode).toBe(currentNode);
      expect(context.masteryScore).toBe(87.5);
      expect(context.confidenceLevel).toBe('high');
      expect(context.performanceHistory).toHaveLength(1);
      expect(context.personalityProfile).toBe(personalityProfile);
    });
  });
});
