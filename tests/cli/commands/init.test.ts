import { describe, it, expect } from 'vitest';
import { createInitCommand } from '../../../src/interfaces/cli/commands/init';

describe('init command', () => {
  it('should create init command', () => {
    const cmd = createInitCommand();
    expect(cmd).toBeDefined();
    expect(cmd.name()).toBe('init');
  });
});
