import { describe, it, expect, vi } from 'vitest';

describe('aibox CLI', () => {
  describe('install command', () => {
    it('should have install command defined', async () => {
      const { program } = await import('../src/index.js');
      const installCommand = program.commands.find(cmd => cmd.name() === 'install');
      expect(installCommand).toBeDefined();
    });

    it('should accept a component name as argument', async () => {
      const { program } = await import('../src/index.js');
      const installCommand = program.commands.find(cmd => cmd.name() === 'install');
      expect(installCommand?.args[0].name).toBe('name');
      expect(installCommand?.args[0].required).toBe(false);
    });

    it('should have scope option with default value', async () => {
      const { program } = await import('../src/index.js');
      const installCommand = program.commands.find(cmd => cmd.name() === 'install');
      const scopeOption = installCommand?.options.find(opt => opt.long === '--scope');
      expect(scopeOption).toBeDefined();
      expect(scopeOption?.defaultValue).toBe('user');
    });
  });

  describe('list command', () => {
    it('should have list command defined', async () => {
      const { program } = await import('../src/index.js');
      const listCommand = program.commands.find(cmd => cmd.name() === 'list');
      expect(listCommand).toBeDefined();
    });

    it('should have type option', async () => {
      const { program } = await import('../src/index.js');
      const listCommand = program.commands.find(cmd => cmd.name() === 'list');
      const typeOption = listCommand?.options.find(opt => opt.long === '--type');
      expect(typeOption).toBeDefined();
    });
  });

  describe('program configuration', () => {
    it('should have correct program name', async () => {
      const { program } = await import('../src/index.js');
      expect(program.name()).toBe('aibox');
    });

    it('should have description', async () => {
      const { program } = await import('../src/index.js');
      expect(program.description()).toBe('Claude Code SACMP Management Tool');
    });

    it('should have version', async () => {
      const { program } = await import('../src/index.js');
      expect(program.version()).toBeDefined();
    });
  });
});
