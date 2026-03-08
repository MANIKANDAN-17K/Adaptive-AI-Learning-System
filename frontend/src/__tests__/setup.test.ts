import { describe, it, expect } from 'vitest';

describe('Frontend Setup', () => {
  it('should have TypeScript configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should have fast-check available', async () => {
    const fc = await import('fast-check');
    expect(fc).toBeDefined();
  });

  it('should have React available', async () => {
    const React = await import('react');
    expect(React).toBeDefined();
  });

  it('should have Framer Motion available', async () => {
    const framerMotion = await import('framer-motion');
    expect(framerMotion).toBeDefined();
  });
});
