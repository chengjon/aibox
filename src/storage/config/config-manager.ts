import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { Config, ProjectConfig } from '../../types';

const DEFAULT_CONFIG: Config = {
  version: '1.0',
  database: {
    type: 'sqlite',
    sqlite: { path: '~/.aibox/data/registry.db' }
  },
  defaultScope: 'user',
  builtinMarketplaces: [
    {
      name: 'anthropic-agent-skills',
      source: { type: 'github', location: 'anthropic/agent-skills' },
      enabled: true
    }
  ],
  cache: {
    ttl: 3600,
    maxSize: 100
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

export class ConfigManager {
  constructor(private configDir: string) {}

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
        throw new Error('Invalid config format');
      }

      return config as Config | ProjectConfig;
    } catch (error) {
      if (scope === 'global') {
        console.warn(`Failed to load config from ${configPath}, using defaults: ${error}`);
        return DEFAULT_CONFIG;
      }
      throw new Error(`Failed to load project config: ${error}`);
    }
  }

  async write(config: Config | ProjectConfig, scope: 'global' | 'project'): Promise<void> {
    const configPath = this.getConfigPath(scope);
    const content = yaml.dump(config);
    writeFileSync(configPath, content, 'utf-8');
  }

  async get<T>(key: string, defaultValue?: T, scope: 'global' | 'project' = 'global'): Promise<T> {
    const config = await this.read(scope);
    const keys = key.split('.');
    let value: any = config;

    for (const k of keys) {
      value = value?.[k];
    }

    return value ?? defaultValue;
  }

  async set(key: string, value: any, scope: 'global' | 'project' = 'global'): Promise<void> {
    const config = await this.read(scope);
    const keys = key.split('.');

    let current: any = config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    await this.write(config, scope);
  }

  private getConfigPath(scope: 'global' | 'project'): string {
    if (scope === 'global') {
      return join(this.configDir, 'config.yaml');
    }
    return join(process.cwd(), '.claude', 'aibox-project.yaml');
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
