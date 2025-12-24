import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import * as yaml from 'js-yaml';
import { Config, ProjectConfig } from '../../types';
import { ValidationError } from '../../core/errors';
import { getDatabasePath, getConfigPath, expandTilde } from '../../core/paths';
import { getLogger } from '../../core/logger';

const logger = getLogger();

// Configuration constants
/** Default cache time-to-live in seconds */
const DEFAULT_CACHE_TTL_SECONDS = 3600;
/** Default maximum cache size */
const DEFAULT_CACHE_MAX_SIZE = 100;

const DEFAULT_CONFIG: Config = {
  version: '1.0',
  database: {
    type: 'sqlite',
    sqlite: { path: getDatabasePath() }
  },
  defaultScope: 'global',
  builtinMarketplaces: [
    {
      name: 'anthropic-agent-skills',
      source: { type: 'github', location: 'anthropic/agent-skills' },
      enabled: true
    }
  ],
  cache: {
    ttl: DEFAULT_CACHE_TTL_SECONDS,
    maxSize: DEFAULT_CACHE_MAX_SIZE
  },
  hotReload: {
    enabled: true,
    signal: 'SIGUSR1',
    detectionMethod: 'process'
  },
  cli: {
    outputFormat: 'pretty',
    colorOutput: true,
    confirmBeforeInstall: true
  }
};

/**
 * Configuration manager for global and project-scoped settings
 *
 * Handles loading, saving, and accessing configuration values
 * from YAML files with support for nested key access.
 */
export class ConfigManager {
  private actualConfigDir: string;

  /**
   * Create a new ConfigManager
   * @param configDir - Directory containing config files (supports ~ expansion)
   */
  constructor(configDir: string) {
    // Expand tilde if present
    this.actualConfigDir = expandTilde(configDir);
  }

  /**
   * Read configuration from file
   * @param scope - Configuration scope ('global' or 'project')
   * @returns Configuration object or defaults if file doesn't exist
   */
  async read(scope: 'global' | 'project'): Promise<Config | ProjectConfig> {
    const configPath = this.getConfigPath(scope);

    if (!existsSync(configPath)) {
      if (scope === 'global') {
        return DEFAULT_CONFIG;
      }
      return this.getDefaultProjectConfig();
    }

    try {
      const content = readFileSync(configPath, 'utf-8');
      const config = yaml.load(content);

      // Basic validation
      if (!config || typeof config !== 'object') {
        throw new ValidationError('Invalid config format', { configPath, scope });
      }

      return config as Config | ProjectConfig;
    } catch (error) {
      if (scope === 'global') {
        logger.warn(`Failed to load config from ${configPath}, using defaults`, { error, configPath });
        return DEFAULT_CONFIG;
      }
      throw new ValidationError(`Failed to load project config`, { configPath, originalError: error });
    }
  }

  /**
   * Write configuration to file
   * @param config - Configuration object to write
   * @param scope - Configuration scope ('global' or 'project')
   */
  async write(config: Config | ProjectConfig, scope: 'global' | 'project'): Promise<void> {
    const configPath = this.getConfigPath(scope);
    const content = yaml.dump(config);
    writeFileSync(configPath, content, 'utf-8');
  }

  /**
   * Get a nested configuration value by dot-separated key
   * @param key - Dot-separated key path (e.g., 'cache.ttl')
   * @param defaultValue - Default value if key not found
   * @param scope - Configuration scope ('global' or 'project')
   * @returns The configuration value or default
   */
  async get<T>(key: string, defaultValue?: T, scope: 'global' | 'project' = 'global'): Promise<T> {
    const config = await this.read(scope);
    const keys = key.split('.');
    let value: Record<string, unknown> | unknown = config;

    for (const k of keys) {
      if (typeof value === 'object' && value !== null) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    return (value ?? defaultValue) as T;
  }

  /**
   * Set a nested configuration value by dot-separated key
   * @param key - Dot-separated key path (e.g., 'cache.ttl')
   * @param value - Value to set
   * @param scope - Configuration scope ('global' or 'project')
   */
  async set<T>(key: string, value: T, scope: 'global' | 'project' = 'global'): Promise<void> {
    const config = await this.read(scope);
    const keys = key.split('.');

    let current: Record<string, unknown> = config as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
    await this.write(config, scope);
  }

  private getConfigPath(scope: 'global' | 'project'): string {
    if (scope === 'global') {
      return join(this.actualConfigDir, 'config.yaml');
    }
    return getConfigPath('project');
  }

  private getDefaultProjectConfig(): ProjectConfig {
    return {
      project: {
        name: '',
        version: '0.1.0'
      },
      lock: {
        skills: [],
        plugins: [],
        commands: [],
        agents: [],
        mcpServers: []
      },
      settings: {
        autoSync: true,
        hotReload: true,
        scope: 'project'
      }
    };
  }
}
