/**
 * Configuration type definitions for AIBox
 */

export interface Config {
  version: string;
  database: DatabaseConfig;
  defaultScope: 'global' | 'project' | 'local';
  builtinMarketplaces: BuiltinMarketplace[];
  cache: CacheConfig;
  hotReload: HotReloadConfig;
  cli: CliConfig;
}

export interface DatabaseConfig {
  type: 'sqlite';
  sqlite: {
    path: string;
  };
}

export interface BuiltinMarketplace {
  name: string;
  source: {
    type: string;
    location: string;
  };
  enabled: boolean;
}

export interface CacheConfig {
  ttl: number;
  maxSize: number;
}

export interface HotReloadConfig {
  enabled: boolean;
  signal: string;
  detectionMethod: 'process' | 'file';
}

export interface CliConfig {
  outputFormat: 'pretty' | 'json' | 'yaml';
  colorOutput: boolean;
  confirmBeforeInstall: boolean;
}

export interface ProjectConfig {
  project: {
    name: string;
    version: string;
  };
  lock: {
    skills?: LockedComponent[];
    plugins?: LockedComponent[];
    commands?: LockedComponent[];
    agents?: LockedComponent[];
    mcpServers?: LockedComponent[];
  };
  settings: {
    autoSync: boolean;
    hotReload: boolean;
    scope: 'global' | 'project' | 'local';
  };
}

export interface LockedComponent {
  name: string;
  version: string;
  source: {
    type: string;
    marketplace?: string;
  };
  installedAt: string;
  enabled: boolean;
}
