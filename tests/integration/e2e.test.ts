import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ConfigManager } from '../../src/storage/config/config-manager';
import { PackageInstaller } from '../../src/core/installer/package-installer';
import { GitHubMarketplace } from '../../src/integrations/marketplaces/github-marketplace';
import { SQLiteAdapter } from '../../src/storage/database/sqlite-adapter';
import { rmSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { mkdtempSync, rmdirSync } from 'fs';

/**
 * End-to-End Integration Test
 *
 * This test verifies the complete installation flow using real marketplace.
 * Note: This test requires network connectivity and may be slow.
 *
 * To skip this test during development:
 *   npm test -- --testNamePatterns="E2E"
 *
 * To run only this test:
 *   npm test -- edge-cases.test.ts
 */

describe('E2E: Component Installation Flow', () => {
  const testDir = mkdtempSync(join(require('os').tmpdir(), 'aibox-e2e-'));
  const testDbPath = join(testDir, 'test-registry.db');
  const componentsDir = join(testDir, 'components');

  let configManager: ConfigManager;
  let dbAdapter: SQLiteAdapter;
  let marketplace: GitHubMarketplace;
  let installer: PackageInstaller;

  beforeAll(async () => {
    // Setup test environment
    configManager = new ConfigManager(testDir);
    dbAdapter = new SQLiteAdapter(testDbPath);
    await dbAdapter.initialize();

    // Use real marketplace
    marketplace = new GitHubMarketplace('anthropic', 'agent-skills');
    installer = new PackageInstaller(marketplace, dbAdapter);

    // Create components directory
    mkdirSync(componentsDir, { recursive: true });
  }, 30000); // 30s timeout for initialization

  afterAll(async () => {
    // Cleanup
    await dbAdapter.close();

    if (existsSync(testDbPath)) {
      rmSync(testDbPath);
    }
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should fetch metadata from real marketplace', async () => {
    const metadata = await marketplace.getMetadata();

    expect(metadata).toBeDefined();
    expect(metadata.name).toBeDefined();
    expect(metadata.plugins).toBeInstanceOf(Array);
    expect(metadata.plugins.length).toBeGreaterThan(0);
  }, 15000);

  it('should list available components from marketplace', async () => {
    const components = await marketplace.listComponents();

    expect(components).toBeInstanceOf(Array);
    expect(components.length).toBeGreaterThan(0);

    // Verify component structure
    const firstComponent = components[0];
    expect(firstComponent).toHaveProperty('name');
    expect(firstComponent).toHaveProperty('type');
    expect(firstComponent).toHaveProperty('version');
    expect(firstComponent).toHaveProperty('description');
  }, 15000);

  it('should get specific component from marketplace', async () => {
    // Get list of components first
    const components = await marketplace.listComponents();
    const firstComponentName = components[0].name;

    // Get specific component
    const component = await marketplace.getComponent(firstComponentName);

    expect(component).toBeDefined();
    expect(component.name).toBe(firstComponentName);
    expect(component.type).toBeDefined();
  }, 15000);

  it('should search components', async () => {
    // Search for common terms
    const searchResults = await marketplace.search('pdf');

    expect(searchResults).toBeInstanceOf(Array);
    // May or may not have results depending on marketplace content
  }, 15000);

  it('should validate repository names with special characters', () => {
    const { ValidationError } = require('../../src/core/errors');

    // Valid names
    expect(() => new GitHubMarketplace('valid-name-123', 'repo')).not.toThrow();
    expect(() => new GitHubMarketplace('valid_name_123', 'repo')).not.toThrow();

    // Invalid names - should throw ValidationError
    expect(() => new GitHubMarketplace('invalid@name', 'repo')).toThrow(ValidationError);
    expect(() => new GitHubMarketplace('invalid name', 'repo')).toThrow(ValidationError);
    expect(() => new GitHubMarketplace('invalid$name', 'repo')).toThrow(ValidationError);
  });

  it('should handle database operations end-to-end', async () => {
    // Add a component
    const testComponent = {
      id: 'e2e-test-1',
      name: 'e2e-test-skill',
      type: 'skill' as const,
      version: '1.0.0',
      description: 'E2E test component',
      source: {
        type: 'marketplace' as const,
        location: 'test',
        marketplace: 'anthropic-agent-skills'
      },
      metadata: {
        tested: true,
        e2e: true
      },
      scope: 'global' as const,
      installedAt: new Date(),
      enabled: true,
      dependencies: []
    };

    await dbAdapter.addComponent(testComponent);

    // Retrieve component
    const retrieved = await dbAdapter.getComponent('e2e-test-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('e2e-test-skill');
    expect(retrieved?.metadata).toEqual({ tested: true, e2e: true });

    // List components
    const allComponents = await dbAdapter.listComponents();
    expect(allComponents.length).toBe(1);
    expect(allComponents[0].name).toBe('e2e-test-skill');

    // List with filter
    const skills = await dbAdapter.listComponents({ type: 'skill' });
    expect(skills.length).toBe(1);

    // Remove component
    await dbAdapter.removeComponent('e2e-test-1');
    const afterRemoval = await dbAdapter.getComponent('e2e-test-1');
    expect(afterRemoval).toBeNull();
  });

  it('should handle config operations end-to-end', async () => {
    // Write config
    await configManager.write({
      version: '1.0',
      database: {
        type: 'sqlite',
        sqlite: { path: testDbPath }
      },
      defaultScope: 'global',
      builtinMarketplaces: [],
      cache: { ttl: 3600, maxSize: 100 },
      hotReload: { enabled: true, signal: 'SIGUSR1', detectionMethod: 'process' },
      cli: { outputFormat: 'pretty', colorOutput: true, confirmBeforeInstall: true }
    }, 'global');

    // Read config
    const config = await configManager.read('global');
    expect(config.version).toBe('1.0');
    expect(config.defaultScope).toBe('global');

    // Get/set individual values
    await configManager.set('test.e2e', 'success', 'global');
    const value = await configManager.get('test.e2e', undefined, 'global');
    expect(value).toBe('success');
  });
});

describe('E2E: Error Handling Integration', () => {
  it('should handle network failures gracefully', async () => {
    const testDir = mkdtempSync(join(require('os').tmpdir(), 'aibox-e2e-error-'));
    const testDbPath = join(testDir, 'test-registry.db');

    const dbAdapter = new SQLiteAdapter(testDbPath);
    await dbAdapter.initialize();

    // Use invalid marketplace
    const marketplace = new GitHubMarketplace('nonexistent-repo-xyz-123', 'does-not-exist-456');
    const installer = new PackageInstaller(marketplace, dbAdapter);

    // Should throw error, not crash
    await expect(
      installer.install({
        name: 'test',
        marketplace: 'nonexistent-repo-xyz-123/does-not-exist-456',
        scope: 'global'
      })
    ).rejects.toThrow();

    await dbAdapter.close();

    if (existsSync(testDbPath)) {
      rmSync(testDbPath);
    }
    if (existsSync(testDir)) {
      rmdirSync(testDir);
    }
  }, 30000);

  it('should handle component not found in marketplace', async () => {
    const marketplace = new GitHubMarketplace('anthropic', 'agent-skills');

    // Try to get non-existent component
    await expect(
      marketplace.getComponent('definitely-not-a-real-component-xyz-123')
    ).rejects.toThrow();
  }, 30000);
});

describe('E2E: Type Safety Integration', () => {
  it('should maintain type safety through entire flow', async () => {
    const { isComponentType, isScope, isSourceType } = require('../../src/types');

    // Test type guards
    expect(isComponentType('skill')).toBe(true);
    expect(isComponentType('plugin')).toBe(true);
    expect(isComponentType('invalid')).toBe(false);

    expect(isScope('global')).toBe(true);
    expect(isScope('project')).toBe(true);
    expect(isScope('local')).toBe(true);
    expect(isScope('invalid')).toBe(false);

    expect(isSourceType('marketplace')).toBe(true);
    expect(isSourceType('local')).toBe(true);
    expect(isSourceType('invalid')).toBe(false);
  });

  it('should handle type guards with database operations', async () => {
    const testDir = mkdtempSync(join(require('os').tmpdir(), 'aibox-e2e-types-'));
    const testDbPath = join(testDir, 'test-registry.db');

    const dbAdapter = new SQLiteAdapter(testDbPath);
    await dbAdapter.initialize();

    // Add components of different types
    const skillComponent = {
      id: 'type-test-1',
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

    const pluginComponent = {
      id: 'type-test-2',
      name: 'test-plugin',
      type: 'plugin' as const,
      version: '1.0.0',
      description: 'Test',
      source: { type: 'marketplace' as const, location: 'test' },
      metadata: {},
      scope: 'global' as const,
      installedAt: new Date(),
      enabled: true,
      dependencies: []
    };

    await dbAdapter.addComponent(skillComponent);
    await dbAdapter.addComponent(pluginComponent);

    // Filter by type
    const skills = await dbAdapter.listComponents({ type: 'skill' });
    const plugins = await dbAdapter.listComponents({ type: 'plugin' });

    expect(skills.length).toBe(1);
    expect(plugins.length).toBe(1);
    expect(skills[0].type).toBe('skill');
    expect(plugins[0].type).toBe('plugin');

    await dbAdapter.close();

    if (existsSync(testDbPath)) {
      rmSync(testDbPath);
    }
    if (existsSync(testDir)) {
      rmdirSync(testDir);
    }
  });
});
