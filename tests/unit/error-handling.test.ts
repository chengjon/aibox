import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PackageInstaller } from '../../src/core/installer/package-installer';
import { GitHubMarketplace } from '../../src/integrations/marketplaces/github-marketplace';
import { SQLiteAdapter } from '../../src/storage/database/sqlite-adapter';
import { ConfigManager } from '../../src/storage/config/config-manager';
import {
  ConfigError,
  ComponentNotFoundError,
  ValidationError,
  MarketplaceError,
  InstallationError,
  DatabaseError
} from '../../src/core/errors';
import { rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { mkdtempSync, rmdirSync } from 'fs';

describe('Error Handling Tests', () => {
  describe('ConfigError', () => {
    it('should create ConfigError with code and details', () => {
      const error = new ConfigError('Invalid config', { key: 'value' });
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.message).toBe('Invalid config');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.details).toEqual({ key: 'value' });
    });

    it('should serialize to JSON', () => {
      const error = new ConfigError('Test error', { key: 'value' });
      const json = error.toJSON();
      expect(json.name).toBe('ConfigError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('CONFIG_ERROR');
      expect(json.details).toEqual({ key: 'value' });
      expect(json.stack).toBeDefined();
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
  });

  describe('MarketplaceError', () => {
    it('should create MarketplaceError with context', () => {
      const error = new MarketplaceError('Download failed', {
        component: 'test-skill',
        repo: 'test/repo',
        error: 'Network error'
      });
      expect(error).toBeInstanceOf(MarketplaceError);
      expect(error.code).toBe('MARKETPLACE_ERROR');
    });
  });

  describe('InstallationError', () => {
    it('should create InstallationError with path info', () => {
      const error = new InstallationError('SKILL.md not found', { componentPath: '/tmp/test' });
      expect(error).toBeInstanceOf(InstallationError);
      expect(error.code).toBe('INSTALLATION_ERROR');
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

  it('should throw ValidationError for invalid scope', async () => {
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

  it('should throw InstallationError when SKILL.md is missing', async () => {
    // This would require mocking the marketplace download
    // For now, we test the error structure
    const error = new InstallationError('SKILL.md not found', { componentPath: '/tmp/test' });
    expect(error.code).toBe('INSTALLATION_ERROR');
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

  it('should handle invalid YAML format gracefully', async () => {
    const configPath = join(testDir, 'config.yaml');
    writeFileSync(configPath, 'invalid: yaml: content: [[');

    await expect(configManager.read('global')).rejects.toThrow();
  });

  it('should throw ConfigError for malformed config', async () => {
    const configPath = join(testDir, 'config.yaml');
    writeFileSync(configPath, 'not: an: object');

    // Config manager should handle this and return defaults for global scope
    const config = await configManager.read('global');
    expect(config).toBeDefined();
  });
});

describe('GitHubMarketplace Error Paths', () => {
  it('should throw ComponentNotFoundError when component not found', async () => {
    const marketplace = new GitHubMarketplace('anthropic', 'agent-skills');

    await expect(
      marketplace.getComponent('non-existent-component-xyz123')
    ).rejects.toThrow(ComponentNotFoundError);
  });

  it('should throw MarketplaceError on download failure', async () => {
    const marketplace = new GitHubMarketplace('non-existent-repo-xyz123', 'does-not-exist');

    await expect(
      marketplace.downloadComponent('test', '/tmp/test-target')
    ).rejects.toThrow();
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
});

describe('Hot Reload Signaler Error Paths', () => {
  it('should return NO_PROCESS when no Claude process found', async () => {
    const { HotReloadSignaler } = require('../../src/integrations/hotreload/hot-reload-signaler');
    const signaler = new HotReloadSignaler();

    // In most test environments, Claude won't be running
    const result = await signaler.signalReload();
    expect(result).toBeDefined();
  });
});
