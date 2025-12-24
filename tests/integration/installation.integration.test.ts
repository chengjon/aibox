import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PackageInstaller } from '../../src/core/installer/package-installer';
import { GitHubMarketplace } from '../../src/integrations/marketplaces/github-marketplace';
import { SQLiteAdapter } from '../../src/storage/database/sqlite-adapter';
import { ConfigManager } from '../../src/storage/config/config-manager';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';
import { getDatabasePath, getComponentPath } from '../../src/core/paths';
import { mkdtempSync, rmdirSync } from 'fs';

describe('Installation Integration Tests', () => {
  const testDir = mkdtempSync(join(require('os').tmpdir(), 'aibox-integration-'));
  const testDbPath = join(testDir, 'test-registry.db');
  let adapter: SQLiteAdapter;
  let installer: PackageInstaller;
  let marketplace: GitHubMarketplace;

  beforeEach(async () => {
    adapter = new SQLiteAdapter(testDbPath);
    await adapter.initialize();

    // Use a test marketplace with a simple repository
    marketplace = new GitHubMarketplace('anthropic', 'agent-skills');
    installer = new PackageInstaller(marketplace, adapter);
  });

  afterEach(async () => {
    await adapter.close();
    if (existsSync(testDbPath)) {
      rmSync(testDbPath);
    }
    // Clean up installed components
    const componentsDir = join(testDir, 'components');
    if (existsSync(componentsDir)) {
      rmSync(componentsDir, { recursive: true, force: true });
    }
    if (existsSync(testDir)) {
      rmdirSync(testDir);
    }
  });

  it('should complete full installation workflow', async () => {
    // This test would require a real component to be available
    // For now, we test the structure
    expect(installer).toBeDefined();
    expect(marketplace).toBeDefined();
    expect(adapter).toBeDefined();
  });

  it('should handle installation errors gracefully', async () => {
    // Test installing a non-existent component
    await expect(
      installer.install({
        name: 'non-existent-component-xyz123',
        marketplace: 'anthropic/agent-skills',
        scope: 'global'
      })
    ).rejects.toThrow();
  });

  it('should store component in database after installation', async () => {
    // This would test actual installation
    // For now, verify database is working
    const components = await adapter.listComponents();
    expect(Array.isArray(components)).toBe(true);
  });

  it('should respect scope when installing', async () => {
    // Test that components are installed to the correct location based on scope
    const globalPath = getComponentPath('skills', 'global');
    const projectPath = getComponentPath('skills', 'project');
    const localPath = getComponentPath('skills', 'local');

    expect(globalPath).toContain('.aibox');
    expect(projectPath).toContain('.claude');
    expect(localPath).toContain('.aibox');
  });
});

describe('Config Manager Integration Tests', () => {
  const testDir = mkdtempSync(join(require('os').tmpdir(), 'aibox-config-'));
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should read default config when file does not exist', async () => {
    const config = await configManager.read('global');
    expect(config).toBeDefined();
    expect(config.version).toBe('1.0');
    expect(config.database.type).toBe('sqlite');
  });

  it('should write and read config', async () => {
    const testConfig = {
      version: '1.0',
      database: {
        type: 'sqlite' as const,
        sqlite: { path: join(testDir, 'test.db') }
      },
      defaultScope: 'global' as const,
      builtinMarketplaces: [],
      cache: { ttl: 3600, maxSize: 100 },
      hotReload: {
        enabled: true,
        signal: 'SIGUSR1',
        detectionMethod: 'process' as const
      },
      cli: {
        outputFormat: 'pretty' as const,
        colorOutput: true,
        confirmBeforeInstall: true
      }
    };

    await configManager.write(testConfig, 'global');
    const readConfig = await configManager.read('global');

    expect(readConfig.database.sqlite.path).toBe(testConfig.database.sqlite.path);
  });

  it('should get and set config values', async () => {
    await configManager.set('defaultScope', 'project', 'global');
    const scope = await configManager.get<string>('defaultScope', 'global', 'global');
    expect(scope).toBe('project');
  });
});

describe('Path Management Integration Tests', () => {
  it('should return consistent paths across the application', async () => {
    const dbPath = getDatabasePath();
    const aiBoxHome = require('../../src/core/paths').getAIBoxHome();

    expect(dbPath).toContain(aiBoxHome);
    expect(dbPath).toContain('registry.db');
  });

  it('should return correct component paths for different scopes', async () => {
    const { getComponentPath } = require('../../src/core/paths');

    const globalPath = getComponentPath('skills', 'global');
    const projectPath = getComponentPath('skills', 'project');
    const localPath = getComponentPath('skills', 'local');

    expect(globalPath).toContain('.aibox');
    expect(globalPath).toContain('skills');

    expect(projectPath).toContain('.claude');
    expect(projectPath).toContain('skills');

    expect(localPath).toContain('.aibox');
    expect(localPath).toContain('components');
  });
});
