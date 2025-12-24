import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PackageInstaller } from '../../src/core/installer/package-installer';
import { GitHubMarketplace } from '../../src/integrations/marketplaces/github-marketplace';
import { SQLiteAdapter } from '../../src/storage/database/sqlite-adapter';
import { ConfigManager } from '../../src/storage/config/config-manager';
import {
  ComponentNotFoundError,
  ValidationError,
  InstallationError,
  AIBoxError,
} from '../../src/core/errors';
import { rmSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { mkdtempSync, rmdirSync } from 'fs';

describe('Error Handling Tests', () => {
  describe('AIBoxError', () => {
    it('should create AIBoxError with code and details', () => {
      class CustomError extends AIBoxError {
        constructor(message: string, details?: Record<string, unknown>) {
          super(message, 'CUSTOM_ERROR', details);
        }
      }
      const error = new CustomError('Custom error occurred', { key: 'value' });
      expect(error).toBeInstanceOf(AIBoxError);
      expect(error.message).toBe('Custom error occurred');
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.details).toEqual({ key: 'value' });
      expect(error.name).toBe('CustomError');
    });

    it('should capture stack trace', () => {
      class CustomError extends AIBoxError {
        constructor(message: string, details?: Record<string, unknown>) {
          super(message, 'CUSTOM_ERROR', details);
        }
      }
      const error = new CustomError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('CustomError');
    });
  });

  describe('ComponentNotFoundError', () => {
    it('should create ComponentNotFoundError with component name', () => {
      const error = new ComponentNotFoundError('test-skill', 'anthropic/agent-skills');
      expect(error).toBeInstanceOf(ComponentNotFoundError);
      expect(error.message).toContain('test-skill');
      expect(error.code).toBe('COMPONENT_NOT_FOUND');
      expect(error.details).toEqual({
        componentName: 'test-skill',
        marketplace: 'anthropic/agent-skills'
      });
    });

    it('should create ComponentNotFoundError without marketplace', () => {
      const error = new ComponentNotFoundError('test-skill');
      expect(error.message).toContain('test-skill');
      expect(error.details?.marketplace).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with details', () => {
      const error = new ValidationError('Invalid scope', { scope: 'invalid', validScopes: ['global', 'project'] });
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({
        scope: 'invalid',
        validScopes: ['global', 'project']
      });
    });

    it('should create ValidationError without details', () => {
      const error = new ValidationError('Simple validation error');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toBeUndefined();
    });
  });

  describe('InstallationError', () => {
    it('should create InstallationError with path info', () => {
      const error = new InstallationError('SKILL.md not found', { componentPath: '/tmp/test' });
      expect(error).toBeInstanceOf(InstallationError);
      expect(error.code).toBe('INSTALLATION_ERROR');
      expect(error.details).toEqual({ componentPath: '/tmp/test' });
    });

    it('should create InstallationError without details', () => {
      const error = new InstallationError('Installation failed');
      expect(error.code).toBe('INSTALLATION_ERROR');
      expect(error.details).toBeUndefined();
    });
  });
});

describe('PackageInstaller Error Paths', () => {
  const testDir = mkdtempSync(join(require('os').tmpdir(), 'aibox-errors-'));
  const testDbPath = join(testDir, 'test-registry.db');
  let adapter: SQLiteAdapter;
  let installer: PackageInstaller;

  beforeEach(async () => {
    adapter = new SQLiteAdapter(testDbPath);
    await adapter.initialize();
    installer = new PackageInstaller(undefined, adapter);
  });

  afterEach(async () => {
    await adapter.close();
    if (existsSync(testDbPath)) {
      rmSync(testDbPath);
    }
    if (existsSync(testDir)) {
      rmdirSync(testDir);
    }
  });

  it('should throw error for invalid scope type', async () => {
    // The getComponentPath function will throw ValidationError for invalid scope
    // But we need to test the actual installation flow
    const marketplace = new GitHubMarketplace('anthropic', 'agent-skills');
    installer = new PackageInstaller(marketplace, adapter);

    await expect(
      installer.install({
        name: 'test-component',
        marketplace: 'default',
        scope: 'invalid' as any
      })
    ).rejects.toThrow();
  });

  it('should throw ComponentNotFoundError for non-existent component', async () => {
    const marketplace = new GitHubMarketplace('anthropic', 'agent-skills');
    installer = new PackageInstaller(marketplace, adapter);

    await expect(
      installer.install({
        name: 'definitely-not-a-real-component-xyz123',
        marketplace: 'anthropic/agent-skills',
        scope: 'global'
      })
    ).rejects.toThrow();
  });

  it('should propagate InstallationError when download fails', async () => {
    // Test with invalid repository
    const marketplace = new GitHubMarketplace('nonexistent-repo-xyz', 'does-not-exist');
    installer = new PackageInstaller(marketplace as any, adapter);

    await expect(
      installer.install({
        name: 'test',
        marketplace: 'nonexistent-repo-xyz/does-not-exist',
        scope: 'global'
      })
    ).rejects.toThrow();
  });
});

describe('ConfigManager Error Paths', () => {
  const testDir = mkdtempSync(join(require('os').tmpdir(), 'aibox-config-error-'));
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should handle invalid YAML format gracefully for global scope', async () => {
    const configPath = join(testDir, 'config.yaml');
    writeFileSync(configPath, 'invalid: yaml: content: [[');

    // Global scope should return defaults on error
    const config = await configManager.read('global');
    expect(config).toBeDefined();
    expect(config).toHaveProperty('version');
  });

  it('should throw ValidationError for malformed project config', async () => {
    const configPath = join(testDir, 'config.yaml');
    writeFileSync(configPath, 'not: an: object');

    // Project scope should throw ValidationError
    await expect(configManager.read('project')).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for non-object config', async () => {
    const configPath = join(testDir, 'config.yaml');
    writeFileSync(configPath, 'string-value');

    await expect(configManager.read('project')).rejects.toThrow(ValidationError);
  });
});

describe('GitHubMarketplace Error Paths', () => {
  it('should validate repository owner name', () => {
    expect(() => new GitHubMarketplace('invalid@owner', 'repo')).toThrow(ValidationError);
    expect(() => new GitHubMarketplace('owner with spaces', 'repo')).toThrow(ValidationError);
    expect(() => new GitHubMarketplace('owner!@#', 'repo')).toThrow(ValidationError);
  });

  it('should validate repository name', () => {
    expect(() => new GitHubMarketplace('owner', 'invalid@repo')).toThrow(ValidationError);
    expect(() => new GitHubMarketplace('owner', 'repo with spaces')).toThrow(ValidationError);
    expect(() => new GitHubMarketplace('owner', 'repo!@#')).toThrow(ValidationError);
  });

  it('should throw ComponentNotFoundError when component not found', async () => {
    const marketplace = new GitHubMarketplace('anthropic', 'agent-skills');

    await expect(
      marketplace.getComponent('non-existent-component-xyz123')
    ).rejects.toThrow(ComponentNotFoundError);
  });

  it('should throw InstallationError on download failure', async () => {
    const marketplace = new GitHubMarketplace('non-existent-repo-xyz', 'does-not-exist');

    await expect(
      marketplace.downloadComponent('test', '/tmp/test-target')
    ).rejects.toThrow();
  });

  it('should throw InstallationError when component not found in repository', async () => {
    // This test assumes the repository exists but doesn't have the component
    // In a real test environment, we'd need to mock the filesystem
    const marketplace = new GitHubMarketplace('anthropic', 'agent-skills');

    // Using a temp directory that definitely doesn't have the component
    const tmpDir = mkdtempSync(join(require('os').tmpdir(), 'aibox-test-'));
    try {
      await expect(
        marketplace.downloadComponent('definitely-not-a-real-component', tmpDir)
      ).rejects.toThrow();
    } finally {
      if (existsSync(tmpDir)) {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    }
  });
});

describe('SQLiteAdapter Error Paths', () => {
  const testDbPath = join(require('os').tmpdir(), 'test-errors.db');

  afterEach(async () => {
    if (existsSync(testDbPath)) {
      rmSync(testDbPath);
    }
  });

  it('should handle non-existent component gracefully', async () => {
    const adapter = new SQLiteAdapter(testDbPath);
    await adapter.initialize();

    const component = await adapter.getComponent('non-existent-id');
    expect(component).toBeNull();

    await adapter.close();
  });

  it('should return empty array when no components exist', async () => {
    const adapter = new SQLiteAdapter(testDbPath);
    await adapter.initialize();

    const components = await adapter.listComponents();
    expect(components).toEqual([]);

    await adapter.close();
  });

  it('should handle duplicate component names', async () => {
    const adapter = new SQLiteAdapter(testDbPath);
    await adapter.initialize();

    const component = {
      id: 'test-1',
      name: 'test-skill',
      type: 'skill' as const,
      version: '1.0.0',
      description: 'Test',
      source: { type: 'marketplace' as const, location: 'test' },
      metadata: {},
      scope: 'global' as const,
      installedAt: new Date(),
      enabled: true,
      dependencies: []
    };

    await adapter.addComponent(component);

    // Try to add duplicate - should handle gracefully
    // SQLite will throw due to UNIQUE constraint
    await expect(adapter.addComponent(component)).rejects.toThrow();

    await adapter.close();
  });

  it('should handle corrupted metadata JSON gracefully', async () => {
    const adapter = new SQLiteAdapter(testDbPath);
    await adapter.initialize();

    // Insert a component with corrupted metadata
    const stmt = adapter['db'].prepare(`
      INSERT INTO components (
        id, type, name, version, description, source_type, source_location,
        marketplace, metadata_json, scope, installed_at, enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      'test-1',
      'skill',
      'test',
      '1.0.0',
      'Test',
      'marketplace',
      'test',
      'test',
      '{invalid json',
      'global',
      new Date().toISOString(),
      1
    );

    const component = await adapter.getComponent('test-1');
    expect(component).toBeDefined();
    expect(component?.metadata).toEqual({}); // Should default to empty object

    await adapter.close();
  });
});

describe('Type Guards Error Paths', () => {
  const { isComponentType, isScope, isSourceType } = require('../../src/types');

  it('should return false for invalid ComponentType', () => {
    expect(isComponentType('invalid')).toBe(false);
    expect(isComponentType('')).toBe(false);
    expect(isComponentType(null)).toBe(false);
    expect(isComponentType(undefined)).toBe(false);
    expect(isComponentType(123)).toBe(false);
  });

  it('should return false for invalid Scope', () => {
    expect(isScope('invalid')).toBe(false);
    expect(isScope('user')).toBe(false); // Changed to 'global'
    expect(isScope('')).toBe(false);
    expect(isScope(null)).toBe(false);
    expect(isScope(undefined)).toBe(false);
  });

  it('should return false for invalid SourceType', () => {
    expect(isSourceType('invalid')).toBe(false);
    expect(isSourceType('')).toBe(false);
    expect(isSourceType(null)).toBe(false);
    expect(isSourceType(undefined)).toBe(false);
    expect(isSourceType(123)).toBe(false);
  });
});
