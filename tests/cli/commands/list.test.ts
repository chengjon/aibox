import { describe, it, expect } from 'vitest';
import { createListCommand } from '../../../src/interfaces/cli/commands/list';

describe('list command', () => {
  it('should create list command', () => {
    const cmd = createListCommand();
    expect(cmd).toBeDefined();
    expect(cmd.name()).toBe('list');
  });
});
