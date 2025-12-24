import { vi } from 'vitest';
import { ComponentInfo } from '../../src/types';

/**
 * Mock for GitHubMarketplace
 * Provides mock data for testing without making real API calls
 */

export const mockComponentInfo: ComponentInfo = {
  name: 'test-skill',
  type: 'skill',
  version: '1.0.0',
  description: 'A test skill for mocking',
  keywords: ['test', 'mock']
};

export const mockMarketplaceMetadata = {
  name: 'test-marketplace',
  version: '1.0.0',
  description: 'A test marketplace',
  plugins: [
    {
      name: 'test-skill',
      version: '1.0.0',
      description: 'A test skill',
      source: 'skills/test-skill'
    }
  ]
};

export function createMockGitHubMarketplace() {
  return {
    getMetadata: vi.fn().mockResolvedValue(mockMarketplaceMetadata),
    listComponents: vi.fn().mockResolvedValue([mockComponentInfo]),
    getComponent: vi.fn().mockImplementation((name: string) => {
      if (name === 'test-skill') {
        return Promise.resolve(mockComponentInfo);
      }
      return Promise.reject(new Error(`Component ${name} not found`));
    }),
    downloadComponent: vi.fn().mockImplementation((name: string, targetPath: string) => {
      if (name === 'test-skill') {
        return Promise.resolve();
      }
      return Promise.reject(new Error(`Component ${name} not found`));
    }),
    search: vi.fn().mockResolvedValue([mockComponentInfo])
  };
}

export function createMockGitHubMarketplaceWithError(error: Error) {
  return {
    getMetadata: vi.fn().mockRejectedValue(error),
    listComponents: vi.fn().mockRejectedValue(error),
    getComponent: vi.fn().mockRejectedValue(error),
    downloadComponent: vi.fn().mockRejectedValue(error),
    search: vi.fn().mockRejectedValue(error)
  };
}

/**
 * Mock for SQLiteAdapter
 */
export function createMockSQLiteAdapter() {
  const components: any[] = [];

  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    addComponent: vi.fn().mockImplementation((component: any) => {
      components.push(component);
      return Promise.resolve();
    }),
    getComponent: vi.fn().mockImplementation((id: string) => {
      return Promise.resolve(components.find(c => c.id === id) || null);
    }),
    listComponents: vi.fn().mockResolvedValue(components),
    removeComponent: vi.fn().mockImplementation((id: string) => {
      const index = components.findIndex(c => c.id === id);
      if (index > -1) {
        components.splice(index, 1);
      }
      return Promise.resolve();
    }),
    close: vi.fn().mockResolvedValue(undefined),
    _getComponents: () => components
  };
}

/**
 * Mock for ConfigManager
 */
export const mockConfig = {
  version: '1.0',
  database: {
    type: 'sqlite' as const,
    sqlite: { path: '/tmp/test.db' }
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

export function createMockConfigManager() {
  let config: any = { ...mockConfig };

  return {
    read: vi.fn().mockImplementation((scope: string) => {
      return Promise.resolve(config);
    }),
    write: vi.fn().mockImplementation((newConfig: any, scope: string) => {
      config = newConfig;
      return Promise.resolve();
    }),
    get: vi.fn().mockImplementation((key: string, defaultValue?: any, scope?: string) => {
      const keys = key.split('.');
      let value: any = config;
      for (const k of keys) {
        value = value?.[k];
      }
      return Promise.resolve(value ?? defaultValue);
    }),
    set: vi.fn().mockImplementation((key: string, value: any, scope?: string) => {
      const keys = key.split('.');
      let current: any = config;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return Promise.resolve();
    })
  };
}

/**
 * Mock file system operations
 */
export function createMockFileSystem() {
  const files: Record<string, string> = {};

  return {
    existsSync: vi.fn((path: string) => !!files[path]),
    readFileSync: vi.fn((path: string) => {
      if (!files[path]) {
        throw new Error(`File not found: ${path}`);
      }
      return files[path];
    }),
    writeFileSync: vi.fn((path: string, content: string) => {
      files[path] = content;
    }),
    mkdirSync: vi.fn(),
    rmSync: vi.fn((path: string) => {
      delete files[path];
    }),
    _getFiles: () => files
  };
}

/**
 * Mock for child_process.execSync
 */
export function createMockExecSync() {
  const outputs: Record<string, string> = {
    'pgrep -f "claude" || true': '',
    'git clone --depth 1 https://github.com/anthropic/agent-skills.git': ''
  };

  return vi.fn().mockImplementation((command: string) => {
    if (outputs[command] !== undefined) {
      return outputs[command];
    }
    throw new Error(`Command not mocked: ${command}`);
  });
}

/**
 * Helper to setup all mocks for a test
 */
export function setupTestMocks() {
  return {
    marketplace: createMockGitHubMarketplace(),
    dbAdapter: createMockSQLiteAdapter(),
    configManager: createMockConfigManager(),
    fs: createMockFileSystem(),
    execSync: createMockExecSync()
  };
}
