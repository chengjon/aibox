import { describe, it, expect } from 'vitest';
import { isComponentType, isScope, isSourceType } from '../../src/types';

describe('Type Guards', () => {
  describe('isComponentType', () => {
    it('should validate all component types', () => {
      expect(isComponentType('skill')).toBe(true);
      expect(isComponentType('plugin')).toBe(true);
      expect(isComponentType('command')).toBe(true);
      expect(isComponentType('agent')).toBe(true);
      expect(isComponentType('mcp_server')).toBe(true);
    });

    it('should reject invalid types', () => {
      expect(isComponentType('invalid')).toBe(false);
      expect(isComponentType('')).toBe(false);
      expect(isComponentType(null)).toBe(false);
      expect(isComponentType(undefined)).toBe(false);
    });
  });

  describe('isScope', () => {
    it('should validate all scopes', () => {
      expect(isScope('user')).toBe(true);
      expect(isScope('project')).toBe(true);
      expect(isScope('local')).toBe(true);
    });

    it('should reject invalid scopes', () => {
      expect(isScope('global')).toBe(false);
      expect(isScope('')).toBe(false);
      expect(isScope(null)).toBe(false);
    });
  });

  describe('isSourceType', () => {
    it('should validate all source types', () => {
      expect(isSourceType('marketplace')).toBe(true);
      expect(isSourceType('git')).toBe(true);
      expect(isSourceType('local')).toBe(true);
      expect(isSourceType('url')).toBe(true);
    });

    it('should reject invalid source types', () => {
      expect(isSourceType('npm')).toBe(false);
      expect(isSourceType('')).toBe(false);
      expect(isSourceType(null)).toBe(false);
    });
  });
});
