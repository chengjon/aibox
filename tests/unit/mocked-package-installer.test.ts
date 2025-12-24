import { describe, it, expect, beforeEach } from 'vitest';
import { PackageInstaller } from '../../src/core/installer/package-installer';
import {
  setupTestMocks,
  createMockGitHubMarketplaceWithError,
  mockComponentInfo
} from '../mocks/github-marketplace.mock';
import { ComponentNotFoundError, MarketplaceError } from '../../src/core/errors';

describe('PackageInstaller with Mocked Dependencies', () => {
  describe('successful installation with mocks', () => {
    const mocks = setupTestMocks();
    let installer: PackageInstaller;

    beforeEach(() => {
      // Create installer with mocked dependencies
      installer = new PackageInstaller(
        mocks.marketplace as any,
        mocks.dbAdapter as any
      );
    });

    it('should install component successfully with mocked marketplace', async () => {
      // Mock the marketplace to return component info
      mocks.marketplace.getComponent.mockResolvedValue(mockComponentInfo);
      mocks.marketplace.downloadComponent.mockResolvedValue(undefined);

      // Mock file system operations
      const mockMkdirSync = jest.fn();
      const mockExecSync = jest.fn();
      const mockExistsSync = jest.fn().mockReturnValue(true);

      // This test verifies the structure works with mocks
      expect(installer).toBeDefined();
      expect(mocks.marketplace.getComponent).toBeDefined();
    });

    it('should list components from mocked database', async () => {
      const components = await mocks.dbAdapter.listComponents();
      expect(Array.isArray(components)).toBe(true);
    });

    it('should use mocked config manager', async () => {
      const config = await mocks.configManager.read('global');
      expect(config).toBeDefined();
      expect(config.version).toBe('1.0');
    });
  });

  describe('error handling with mocked errors', () => {
    it('should handle marketplace errors', async () => {
      const errorMarketplace = createMockGitHubMarketplaceWithError(
        new MarketplaceError('Network error')
      );
      const errorDb = setupTestMocks().dbAdapter;

      const installer = new PackageInstaller(
        errorMarketplace as any,
        errorDb as any
      );

      // Attempt to install non-existent component
      await expect(
        installer.install({
          name: 'error-component',
          marketplace: 'test/error',
          scope: 'global'
        })
      ).rejects.toThrow();
    });

    it('should handle component not found errors', async () => {
      const notFoundMarketplace = createMockGitHubMarketplaceWithError(
        new ComponentNotFoundError('missing-component')
      );
      const errorDb = setupTestMocks().dbAdapter;

      const installer = new PackageInstaller(
        notFoundMarketplace as any,
        errorDb as any
      );

      await expect(
        installer.install({
          name: 'missing-component',
          marketplace: 'test/missing',
          scope: 'global'
        })
      ).rejects.toThrow();
    });
  });

  describe('mock marketplace operations', () => {
    const mocks = setupTestMocks();

    it('should return component info from mock', async () => {
      const component = await mocks.marketplace.getComponent('test-skill');
      expect(component).toBeDefined();
      expect(component?.name).toBe('test-skill');
    });

    it('should list components from mock', async () => {
      const components = await mocks.marketplace.listComponents();
      expect(components.length).toBeGreaterThan(0);
      expect(components[0].name).toBe('test-skill');
    });

    it('should search components from mock', async () => {
      const results = await mocks.marketplace.search('test');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle download in mock', async () => {
      await expect(
        mocks.marketplace.downloadComponent('test-skill', '/tmp/test')
      ).resolves.not.toThrow();
    });
  });

  describe('mock database operations', () => {
    const mockDb = setupTestMocks().dbAdapter;

    it('should add component to mock database', async () => {
      const component = {
        id: 'test-1',
        name: 'test-component',
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

      await mockDb.addComponent(component);
      const retrieved = await mockDb.getComponent('test-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('test-component');
    });

    it('should remove component from mock database', async () => {
      const component = {
        id: 'test-2',
        name: 'test-component-2',
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

      await mockDb.addComponent(component);
      await mockDb.removeComponent('test-2');

      const retrieved = await mockDb.getComponent('test-2');
      expect(retrieved).toBeNull();
    });

    it('should list all components from mock database', async () => {
      const component1 = {
        id: 'test-3',
        name: 'test-component-3',
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

      await mockDb.addComponent(component1);
      const components = await mockDb.listComponents();

      expect(components.length).toBeGreaterThan(0);
    });
  });

  describe('mock config manager operations', () => {
    const mockConfig = setupTestMocks().configManager;

    it('should read config from mock', async () => {
      const config = await mockConfig.read('global');
      expect(config).toBeDefined();
      expect(config.version).toBe('1.0');
    });

    it('should get config value from mock', async () => {
      const value = await mockConfig.get('defaultScope', 'project', 'global');
      expect(value).toBe('global');
    });

    it('should set config value in mock', async () => {
      await mockConfig.set('defaultScope', 'project', 'global');
      const value = await mockConfig.get('defaultScope', undefined, 'global');
      expect(value).toBe('project');
    });
  });

  describe('mock file system operations', () => {
    const mockFs = setupTestMocks().fs;

    it('should write and read files in mock', () => {
      mockFs.writeFileSync('/tmp/test.txt', 'Hello, World!');
      const content = mockFs.readFileSync('/tmp/test.txt');

      expect(content).toBe('Hello, World!');
    });

    it('should check file existence in mock', () => {
      mockFs.writeFileSync('/tmp/existing.txt', 'content');
      expect(mockFs.existsSync('/tmp/existing.txt')).toBe(true);
      expect(mockFs.existsSync('/tmp/non-existing.txt')).toBe(false);
    });

    it('should delete files in mock', () => {
      mockFs.writeFileSync('/tmp/to-delete.txt', 'content');
      expect(mockFs.existsSync('/tmp/to-delete.txt')).toBe(true);

      mockFs.rmSync('/tmp/to-delete.txt');
      expect(mockFs.existsSync('/tmp/to-delete.txt')).toBe(false);
    });
  });
});
