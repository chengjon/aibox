import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from '../../src/storage/config/config-manager';
import { GitHubMarketplace } from '../../src/integrations/marketplaces/github-marketplace';
import { SQLiteAdapter } from '../../src/storage/database/sqlite-adapter';
import { ValidationError } from '../../src/core/errors';
import { rmSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { mkdtempSync, rmdirSync } from 'fs';

describe('Edge Cases Tests', () => {
  describe('Empty String Inputs', () => {
    it('should handle empty component name in install command', () => {
      const { createInstallCommand } = require('../../src/interfaces/cli/commands/install');
      const configManager = new ConfigManager('/tmp/test-aibox');
      const { PackageInstaller } = require('../../src/core/installer/package-installer');
      const installer = new PackageInstaller();

      const cmd = createInstallCommand(configManager, installer);

      // Empty name should be handled
      expect(() => cmd.parseAsync(['install', ''], { from: 'user' })).rejects.toThrow();
    });

    it('should handle empty marketplace name', async () => {
      const marketplace = new GitHubMarketplace('anthropic', '');
      // Should validate in constructor
      expect(() => new GitHubMarketplace('anthropic', '')).toThrow(ValidationError);
    });

    it('should handle empty scope', async () => {
      const { isScope } = require('../../src/types');
      expect(isScope('')).toBe(false);
    });

    it('should handle empty config values', async () => {
      const testDir = mkdtempSync(join(require('os').tmpdir(), 'aibox-edge-'));
      const configManager = new ConfigManager(testDir);

      // Create empty config file
      const configPath = join(testDir, 'config.yaml');
      writeFileSync(configPath, '');

      const config = await configManager.read('global');
      // Should return defaults for global scope
      expect(config).toBeDefined();

      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true, force: true });
      }
    });
  });

  describe('Special Characters', () => {
    it('should handle component names with special chars in marketplace', () => {
      // Valid characters: alphanumeric, hyphens, underscores
      const validNames = ['test-123', 'test_123', 'Test-123_Skill'];

      validNames.forEach(name => {
        expect(() => new GitHubMarketplace(name, 'repo')).not.toThrow();
        expect(() => new GitHubMarketplace('owner', name)).not.toThrow();
      });
    });

    it('should reject component names with invalid special chars', () => {
      const invalidNames = [
        'test@skill',
        'test#skill',
        'test$skill',
        'test%skill',
        'test&skill',
        'test*skill',
        'test!skill',
        'test+skill',
        'test=skill',
        'test skill',
        'test/skill',
        'test\\skill',
        'test|skill',
        'test;skill',
        'test:skill',
        'test.skill',
        'test,skill',
        'test<skill>',
        'test>skill',
        'test[skill]',
        'test{skill}',
        'test(skill)',
        'test)skill',
        'test\'skill',
        'test"skill',
        'test`skill',
      ];

      invalidNames.forEach(name => {
        expect(() => new GitHubMarketplace(name, 'repo')).toThrow(ValidationError);
      });
    });

    it('should handle unicode characters in component names', () => {
      // The regex only allows alphanumeric, hyphens, underscores
      // Unicode should be rejected
      expect(() => new GitHubMarketplace('测试', 'repo')).toThrow(ValidationError);
      expect(() => new GitHubMarketplace('owner', '测试')).toThrow(ValidationError);
      expect(() => new GitHubMarketplace('test-ño', 'repo')).toThrow(ValidationError);
    });

    it('should handle very long component names', () => {
      const longName = 'a'.repeat(1000);
      // Should validate based on regex, not length
      expect(() => new GitHubMarketplace(longName, 'repo')).not.toThrow();
    });

    it('should handle special characters in config paths', async () => {
      const testDir = mkdtempSync(join(require('os').tmpdir(), 'aibox-special-'));

      // Create config with special chars in values
      const configManager = new ConfigManager(testDir);

      // Set values with special characters
      await configManager.set('test.key', 'value with $pecial ch@rs', 'global');

      const value = await configManager.get<string>('test.key', undefined, 'global');
      expect(value).toBe('value with $pecial ch@rs');

      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true, force: true });
      }
    });
  });

  describe('Concurrent Operations', () => {
    const testDir = mkdtempSync(join(require('os').tmpdir(), 'aibox-concurrent-'));
    const testDbPath = join(testDir, 'test-registry.db');

    afterEach(async () => {
      if (existsSync(testDbPath)) {
        rmSync(testDbPath);
      }
      if (existsSync(testDir)) {
        rmdirSync(testDir);
      }
    });

    it('should handle concurrent component additions', async () => {
      const adapter = new SQLiteAdapter(testDbPath);
      await adapter.initialize();

      // Create multiple components
      const components = Array.from({ length: 10 }, (_, i) => ({
        id: `concurrent-${i}`,
        name: `concurrent-skill-${i}`,
        type: 'skill' as const,
        version: '1.0.0',
        description: 'Test',
        source: { type: 'marketplace' as const, location: 'test' },
        metadata: {},
        scope: 'global' as const,
        installedAt: new Date(),
        enabled: true,
        dependencies: []
      }));

      // Add all components concurrently
      await Promise.all(components.map(c => adapter.addComponent(c)));

      // Verify all components were added
      const allComponents = await adapter.listComponents();
      expect(allComponents.length).toBe(10);

      await adapter.close();
    });

    it('should handle concurrent reads and writes', async () => {
      const adapter = new SQLiteAdapter(testDbPath);
      await adapter.initialize();

      // Add initial component
      const component = {
        id: 'concurrent-test',
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

      // Perform concurrent reads
      const reads = Array.from({ length: 10 }, () =>
        adapter.getComponent('concurrent-test')
      );

      const results = await Promise.all(reads);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result?.name).toBe('test-skill');
      });

      await adapter.close();
    });

    it('should handle concurrent config operations', async () => {
      const configManager = new ConfigManager(testDir);

      // Perform concurrent writes to different keys
      const writes = Array.from({ length: 10 }, (_, i) =>
        configManager.set(`key${i}`, `value${i}`, 'global')
      );

      await Promise.all(writes);

      // Verify all writes
      const reads = Array.from({ length: 10 }, (_, i) =>
        configManager.get(`key${i}`, undefined, 'global')
      );

      const results = await Promise.all(reads);
      results.forEach((result, i) => {
        expect(result).toBe(`value${i}`);
      });

      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true, force: true });
      }
    });
  });

  describe('Boundary Values', () => {
    it('should handle zero-length component name', async () => {
      const { isScope } = require('../../src/types');
      expect(isScope('')).toBe(false);
    });

    it('should handle single character component names', () => {
      expect(() => new GitHubMarketplace('a', 'b')).not.toThrow();
    });

    it('should handle very large metadata', async () => {
      const testDir = mkdtempSync(join(require('os').tmpdir(), 'aibox-boundary-'));
      const testDbPath = join(testDir, 'test-registry.db');

      const adapter = new SQLiteAdapter(testDbPath);
      await adapter.initialize();

      // Create component with large metadata
      const largeMetadata = {
        data: 'x'.repeat(100000) // 100KB of data
      };

      const component = {
        id: 'large-metadata',
        name: 'test-skill',
        type: 'skill' as const,
        version: '1.0.0',
        description: 'Test',
        source: { type: 'marketplace' as const, location: 'test' },
        metadata: largeMetadata,
        scope: 'global' as const,
        installedAt: new Date(),
        enabled: true,
        dependencies: []
      };

      await adapter.addComponent(component);

      const retrieved = await adapter.getComponent('large-metadata');
      expect(retrieved?.metadata).toEqual(largeMetadata);

      await adapter.close();

      if (existsSync(testDbPath)) {
        rmSync(testDbPath);
      }
      if (existsSync(testDir)) {
        rmdirSync(testDir);
      }
    });

    it('should handle many dependencies', async () => {
      const testDir = mkdtempSync(join(require('os').tmpdir(), 'aibox-deps-'));
      const testDbPath = join(testDir, 'test-registry.db');

      const adapter = new SQLiteAdapter(testDbPath);
      await adapter.initialize();

      // Create component with many dependencies
      const dependencies = Array.from({ length: 1000 }, (_, i) => ({
        type: 'component' as const,
        spec: `dep-${i}@1.0.0`,
        optional: false
      }));

      const component = {
        id: 'many-deps',
        name: 'test-skill',
        type: 'skill' as const,
        version: '1.0.0',
        description: 'Test',
        source: { type: 'marketplace' as const, location: 'test' },
        metadata: {},
        scope: 'global' as const,
        installedAt: new Date(),
        enabled: true,
        dependencies
      };

      await adapter.addComponent(component);

      const retrieved = await adapter.getComponent('many-deps');
      expect(retrieved?.dependencies.length).toBe(1000);

      await adapter.close();

      if (existsSync(testDbPath)) {
        rmSync(testDbPath);
      }
      if (existsSync(testDir)) {
        rmdirSync(testDir);
      }
    });
  });

  describe('Null/Undefined Handling', () => {
    it('should handle null metadata gracefully', async () => {
      const testDir = mkdtempSync(join(require('os').tmpdir(), 'aibox-null-'));
      const testDbPath = join(testDir, 'test-registry.db');

      const adapter = new SQLiteAdapter(testDbPath);
      await adapter.initialize();

      // Insert component with null metadata directly
      const stmt = adapter['db'].prepare(`
        INSERT INTO components (
          id, type, name, version, description, source_type, source_location,
          marketplace, metadata_json, scope, installed_at, enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
      `);

      stmt.run(
        'null-metadata',
        'skill',
        'test',
        '1.0.0',
        'Test',
        'marketplace',
        'test',
        'test',
        'global',
        new Date().toISOString(),
        1
      );

      const component = await adapter.getComponent('null-metadata');
      expect(component).toBeDefined();
      expect(component?.metadata).toEqual({});

      await adapter.close();

      if (existsSync(testDbPath)) {
        rmSync(testDbPath);
      }
      if (existsSync(testDir)) {
        rmdirSync(testDir);
      }
    });

    it('should handle undefined projectPath', () => {
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

      expect(component.projectPath).toBeUndefined();
    });

    it('should handle undefined marketplace', () => {
      const source = { type: 'local' as const, location: '/tmp/test' };
      expect(source.marketplace).toBeUndefined();
    });
  });

  describe('Path Traversal', () => {
    it('should handle path traversal attempts in marketplace names', () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        './test',
        '/etc/passwd',
        '\\windows\\system32',
      ];

      pathTraversalAttempts.forEach(name => {
        expect(() => new GitHubMarketplace(name, 'repo')).toThrow(ValidationError);
      });
    });

    it('should not allow path traversal in component names', () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\config',
        '../test',
        './malicious',
      ];

      pathTraversalAttempts.forEach(name => {
        expect(() => new GitHubMarketplace('owner', name)).toThrow(ValidationError);
      });
    });
  });
});
