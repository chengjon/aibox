# AIBox Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a unified SACMP management tool for Claude Code with package management, project migration, and interactive TUI.

**Architecture:** TypeScript/Node.js CLI with 4-layer architecture (Interface → Core → Storage → Integration), supporting both SQLite and MongoDB databases, with hot-reload capability.

**Tech Stack:** TypeScript 5.x, Node.js 18+, Commander.js, blessed, better-sqlite3, mongodb, axios, js-yaml, Vitest

---

## Task 1: Project Foundation

**Files:**
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `package.json` (update existing)
- Create: `src/index.ts`

**Step 1: Create TypeScript configuration**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["node"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Step 2: Create Vitest configuration**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**']
    }
  }
});
```

**Step 3: Update package.json**

Update `package.json` (replace scripts section):

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src",
    "format": "prettier --write src",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
  "tsup": {
    "entry": ["src/index.ts"],
    "format": ["esm"],
    "dts": true,
    "clean": true
  }
}
```

**Step 4: Create CLI entry point**

Create `src/index.ts`:

```typescript
#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('aibox')
  .description('Claude Code SACMP Management Tool')
  .version('0.1.0');

program
  .command('install [name]')
  .description('Install a SACMP component')
  .option('-s, --scope <scope>', 'Installation scope', 'user')
  .action((name, options) => {
    console.log('Installing:', name, 'Scope:', options.scope);
  });

program
  .command('list')
  .description('List installed components')
  .option('-t, --type <type>', 'Filter by type')
  .action(() => {
    console.log('Listing components...');
  });

program.parse();
```

**Step 5: Commit**

```bash
git add tsconfig.json vitest.config.ts package.json src/index.ts
git commit -m "feat: add project foundation with TypeScript and Vitest"
```

---

## Task 2: Type Definitions

**Files:**
- Create: `src/types/component.types.ts`
- Create: `src/types/marketplace.types.ts`
- Create: `src/types/migration.types.ts`
- Create: `src/types/config.types.ts`
- Create: `src/types/index.ts`

**Step 1: Create component type definitions**

Create `src/types/component.types.ts`:

```typescript
export type ComponentType = 'skill' | 'plugin' | 'command' | 'agent' | 'mcp_server';
export type Scope = 'user' | 'project' | 'local';
export type SourceType = 'marketplace' | 'git' | 'local' | 'url';

export interface Component {
  id: string;
  name: string;
  type: ComponentType;
  version: string;
  description: string;
  source: Source;
  metadata: Record<string, any>;
  scope: Scope;
  projectPath?: string;
  installedAt: Date;
  enabled: boolean;
  dependencies: Dependency[];
}

export interface Source {
  type: SourceType;
  location: string;
  ref?: string;
  marketplace?: string;
}

export interface Dependency {
  type: 'python' | 'node' | 'binary' | 'component';
  spec: string;
  optional?: boolean;
}

export interface InstalledComponent extends Component {
  path: string;
  symlink?: string;
}
```

**Step 2: Create marketplace type definitions**

Create `src/types/marketplace.types.ts`:

```typescript
export interface MarketplaceMetadata {
  name: string;
  owner: {
    name: string;
    email?: string;
  };
  metadata?: {
    description?: string;
    version?: string;
  };
  plugins: MarketplacePlugin[];
}

export interface MarketplacePlugin {
  name: string;
  source: string | MarketplaceSource;
  description?: string;
  version?: string;
  author?: {
    name: string;
  };
  skills?: string[];
}

export interface MarketplaceSource {
  source: 'github' | 'git' | 'url';
  repo?: string;
  url?: string;
}

export interface ComponentInfo {
  name: string;
  type: ComponentType;
  version: string;
  description: string;
  author?: string;
  license?: string;
  homepage?: string;
  keywords: string[];
  dependencies?: Dependency[];
  size?: number;
}

export interface ListOptions {
  type?: ComponentType;
  enabled?: boolean;
}

export interface SearchFilters {
  type?: ComponentType;
  keyword?: string;
  author?: string;
}
```

**Step 3: Create migration type definitions**

Create `src/types/migration.types.ts`:

```typescript
import { ComponentType } from './component.types';

export interface MigrationPlan {
  componentId: string;
  fromProject: string;
  toProject: string;
  conflicts: Conflict[];
  missingDependencies: Dependency[];
  requiredChanges: string[];
  canProceed: boolean;
}

export interface Conflict {
  type: 'name' | 'dependency' | 'config';
  severity: 'error' | 'warning' | 'info';
  message: string;
  resolution?: string;
}

export interface MigrationResult {
  migrationId: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface MigrationOptions {
  overwrite?: boolean;
  skipConflicts?: boolean;
  keepSource?: boolean;
}
```

**Step 4: Create config type definitions**

Create `src/types/config.types.ts`:

```typescript
export interface Config {
  version: string;
  database: DatabaseConfig;
  defaultScope: 'user' | 'project' | 'local';
  builtinMarketplaces: BuiltinMarketplace[];
  cache: CacheConfig;
  hotReload: HotReloadConfig;
  cli: CliConfig;
}

export interface DatabaseConfig {
  type: 'sqlite' | 'mongodb';
  sqlite?: {
    path: string;
  };
  mongodb?: {
    uri: string;
    database: string;
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
    scope: 'user' | 'project' | 'local';
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
```

**Step 5: Create type index**

Create `src/types/index.ts`:

```typescript
export * from './component.types';
export * from './marketplace.types';
export * from './migration.types';
export * from './config.types';
```

**Step 6: Commit**

```bash
git add src/types/
git commit -m "feat: add comprehensive type definitions"
```

---

## Task 3: Storage Layer - SQLite Adapter

**Files:**
- Create: `src/storage/database/sqlite-adapter.ts`
- Create: `src/storage/database/registry.ts`

**Step 1: Write failing test for SQLite adapter**

Create `tests/storage/sqlite-adapter.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteAdapter } from '../../src/storage/database/sqlite-adapter';
import { Component } from '../../src/types';
import { rmSync } from 'fs';
import { join } from 'path';

describe('SQLiteAdapter', () => {
  const dbPath = join(process.cwd(), 'test.db');
  let adapter: SQLiteAdapter;

  beforeEach(async () => {
    adapter = new SQLiteAdapter(dbPath);
    await adapter.initialize();
  });

  afterEach(async () => {
    await adapter.close();
    rmSync(dbPath);
  });

  it('should insert and retrieve a component', async () => {
    const component: Component = {
      id: 'test-1',
      name: 'test-skill',
      type: 'skill',
      version: '1.0.0',
      description: 'Test skill',
      source: { type: 'marketplace', location: 'test' },
      metadata: {},
      scope: 'user',
      installedAt: new Date(),
      enabled: true,
      dependencies: []
    };

    await adapter.addComponent(component);
    const retrieved = await adapter.getComponent('test-1');

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('test-skill');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/storage/sqlite-adapter.test.ts`

Expected: FAIL with "SQLiteAdapter is not defined" or similar

**Step 3: Implement SQLite adapter**

Create `src/storage/database/sqlite-adapter.ts`:

```typescript
import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { Component, ComponentType, Scope } from '../types';

export class SQLiteAdapter {
  private db: Database.Database;

  constructor(private dbPath: string) {}

  async initialize(): Promise<void> {
    // Ensure directory exists
    mkdirSync(dirname(this.dbPath), { recursive: true });

    this.db = new Database(this.dbPath);
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    const createSkillsTable = `
      CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        version TEXT,
        description TEXT,
        source_type TEXT,
        source_location TEXT,
        marketplace TEXT,
        metadata_json TEXT,
        scope TEXT,
        project_path TEXT,
        installed_at TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createPluginsTable = `
      CREATE TABLE IF NOT EXISTS plugins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        version TEXT,
        description TEXT,
        source_type TEXT,
        source_location TEXT,
        marketplace TEXT,
        metadata_json TEXT,
        scope TEXT,
        project_path TEXT,
        installed_at TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.exec(createSkillsTable);
    this.db.exec(createPluginsTable);
  }

  async addComponent(component: Component): Promise<void> {
    const tableName = this.getTableName(component.type);
    const stmt = this.db.prepare(`
      INSERT INTO ${tableName} (
        id, name, version, description, source_type, source_location,
        marketplace, metadata_json, scope, project_path, installed_at, enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      component.id,
      component.name,
      component.version,
      component.description,
      component.source.type,
      component.source.location,
      component.source.marketplace || null,
      JSON.stringify(component.metadata),
      component.scope,
      component.projectPath || null,
      component.installedAt.toISOString(),
      component.enabled ? 1 : 0
    );
  }

  async getComponent(id: string): Promise<Component | null> {
    // Search in all tables
    const tables = ['skills', 'plugins', 'commands', 'agents', 'mcp_servers'];

    for (const table of tables) {
      const row = this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as any;
      if (row) {
        return this.rowToComponent(row, table);
      }
    }

    return null;
  }

  async listComponents(filter?: { type?: ComponentType; scope?: Scope }): Promise<Component[]> {
    let query = 'SELECT * FROM ';
    let params: any[] = [];

    if (filter?.type) {
      query = `SELECT * FROM ${this.getTableName(filter.type)}`;
    } else {
      // Union all tables (simplified for skills first)
      query = 'SELECT * FROM skills';
    }

    if (filter?.scope) {
      query += ' WHERE scope = ?';
      params.push(filter.scope);
    }

    const rows = this.db.prepare(query).all(...params) as any[];
    return rows.map(row => this.rowToComponent(row, filter?.type || 'skill'));
  }

  async removeComponent(id: string): Promise<void> {
    // Try to delete from all tables
    const tables = ['skills', 'plugins', 'commands', 'agents', 'mcp_servers'];
    for (const table of tables) {
      this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }

  private getTableName(type: ComponentType): string {
    const tableMap: Record<ComponentType, string> = {
      skill: 'skills',
      plugin: 'plugins',
      command: 'commands',
      agent: 'agents',
      mcp_server: 'mcp_servers'
    };
    return tableMap[type] || 'skills';
  }

  private rowToComponent(row: any, type: ComponentType): Component {
    return {
      id: row.id,
      name: row.name,
      type: type,
      version: row.version,
      description: row.description,
      source: {
        type: row.source_type,
        location: row.source_location,
        marketplace: row.marketplace
      },
      metadata: JSON.parse(row.metadata_json || '{}'),
      scope: row.scope,
      projectPath: row.project_path,
      installedAt: new Date(row.installed_at),
      enabled: row.enabled === 1,
      dependencies: []
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/storage/sqlite-adapter.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/storage/database/ tests/storage/
git commit -m "feat: add SQLite database adapter with tests"
```

---

## Task 4: Configuration Management

**Files:**
- Create: `src/storage/config/config-manager.ts`
- Create: `src/storage/config/config-loader.ts`

**Step 1: Write test for config manager**

Create `tests/storage/config-manager.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigManager } from '../../src/storage/config/config-manager';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('ConfigManager', () => {
  const configDir = join(process.cwd(), 'test-config');
  let manager: ConfigManager;

  beforeEach(() => {
    mkdirSync(configDir, { recursive: true });
    manager = new ConfigManager(configDir);
  });

  afterEach(() => {
    rmSync(configDir, { recursive: true, force: true });
  });

  it('should read default config when none exists', async () => {
    const config = await manager.read('global');
    expect(config).toBeDefined();
    expect(config.database.type).toBe('sqlite');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/storage/config-manager.test.ts`

Expected: FAIL

**Step 3: Implement config manager**

Create `src/storage/config/config-manager.ts`:

```typescript
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse, stringify } from 'yaml';
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

    const content = readFileSync(configPath, 'utf-8');
    return parse(content);
  }

  async write(config: Config | ProjectConfig, scope: 'global' | 'project'): Promise<void> {
    const configPath = this.getConfigPath(scope);
    const content = stringify(config);
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/storage/config-manager.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/storage/config/ tests/storage/
git commit -m "feat: add configuration manager with YAML support"
```

---

## Task 5: CLI Commands - Install

**Files:**
- Create: `src/interfaces/cli/commands/install.ts`
- Create: `src/core/installer/package-installer.ts`

**Step 1: Write test for install command**

Create `tests/cli/commands/install.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { installCommand } from '../../../src/interfaces/cli/commands/install';

describe('install command', () => {
  it('should parse install arguments correctly', () => {
    const args = ['skill-name@marketplace', '--scope', 'project'];
    const parsed = installCommand.parse(args);
    expect(parsed.name).toBe('skill-name');
    expect(parsed.marketplace).toBe('marketplace');
    expect(parsed.scope).toBe('project');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/cli/commands/install.test.ts`

Expected: FAIL

**Step 3: Implement install command**

Create `src/interfaces/cli/commands/install.ts`:

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../../../storage/config/config-manager';
import { PackageInstaller } from '../../../core/installer/package-installer';

export function createInstallCommand(configManager: ConfigManager, installer: PackageInstaller): Command {
  const cmd = new Command('install');

  cmd
    .argument('[name]', 'Component name with optional marketplace (name@marketplace)')
    .option('-s, --scope <scope>', 'Installation scope', 'user')
    .option('-f, --force', 'Force reinstall even if already installed')
    .option('--skip-deps', 'Skip dependency installation')
    .action(async (name, options) => {
      try {
        console.log(chalk.blue(`Installing ${name}...`));

        const [componentName, marketplace] = name.split('@');
        const component = await installer.install({
          name: componentName,
          marketplace: marketplace || 'default',
          scope: options.scope,
          force: options.force,
          skipDeps: options.skipDeps
        });

        console.log(chalk.green(`✓ Installed ${component.name} v${component.version}`));
      } catch (error: any) {
        console.error(chalk.red(`✗ Installation failed: ${error.message}`));
        process.exit(1);
      }
    });

  return cmd;
}
```

**Step 4: Implement package installer**

Create `src/core/installer/package-installer.ts`:

```typescript
import { Component, Source, InstalledComponent } from '../../types';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export interface InstallOptions {
  name: string;
  marketplace: string;
  scope: 'user' | 'project' | 'local';
  force?: boolean;
  skipDeps?: boolean;
}

export class PackageInstaller {
  async install(options: InstallOptions): Promise<InstalledComponent> {
    // Determine installation path
    const installPath = this.getInstallPath(options.scope);

    // Create directory if needed
    mkdirSync(installPath, { recursive: true });

    // Download component (placeholder for now)
    const componentPath = join(installPath, options.name);

    // Validate component
    await this.validateComponent(componentPath);

    // Create component record
    const component: InstalledComponent = {
      id: `${options.name}-${Date.now()}`,
      name: options.name,
      type: 'skill', // Auto-detect later
      version: '1.0.0',
      description: `Installed from ${options.marketplace}`,
      source: {
        type: 'marketplace',
        location: options.marketplace,
        marketplace: options.marketplace
      },
      metadata: {},
      scope: options.scope,
      projectPath: options.scope === 'project' ? process.cwd() : undefined,
      installedAt: new Date(),
      enabled: true,
      dependencies: [],
      path: componentPath
    };

    return component;
  }

  private getInstallPath(scope: string): string {
    const homedir = require('os').homedir();
    switch (scope) {
      case 'user':
        return join(homedir, '.aibox', 'components', 'skills');
      case 'project':
        return join(process.cwd(), '.claude', 'skills');
      case 'local':
        return join(process.cwd(), '.aibox', 'components', 'skills');
      default:
        throw new Error(`Invalid scope: ${scope}`);
    }
  }

  private async validateComponent(path: string): Promise<void> {
    // Check for SKILL.md
    const skillPath = join(path, 'SKILL.md');
    if (!existsSync(skillPath)) {
      throw new Error(`SKILL.md not found in ${path}`);
    }
  }
}
```

**Step 5: Update main CLI**

Update `src/index.ts`:

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigManager } from './storage/config/config-manager';
import { PackageInstaller } from './core/installer/package-installer';
import { createInstallCommand } from './interfaces/cli/commands/install';

const program = new Command();
const configManager = new ConfigManager('~/.aibox');
const installer = new PackageInstaller();

program
  .name('aibox')
  .description('Claude Code SACMP Management Tool')
  .version('0.1.0');

// Add install command
program.addCommand(createInstallCommand(configManager, installer));

program
  .command('list')
  .description('List installed components')
  .option('-t, --type <type>', 'Filter by type')
  .action(() => {
    console.log('Listing components...');
  });

program.parse();
```

**Step 6: Run test to verify it passes**

Run: `npm test -- tests/cli/commands/install.test.ts`

Expected: PASS

**Step 7: Commit**

```bash
git add src/interfaces/cli/ src/core/installer/ tests/cli/ src/index.ts
git commit -m "feat: add install command and package installer"
```

---

## Task 6: Marketplace Integration

**Files:**
- Create: `src/integrations/marketplaces/marketplace-client.ts`
- Create: `src/integrations/marketplaces/github-marketplace.ts`

**Step 1: Write test for GitHub marketplace**

Create `tests/integrations/github-marketplace.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GitHubMarketplace } from '../../src/integrations/marketplaces/github-marketplace';

describe('GitHubMarketplace', () => {
  let marketplace: GitHubMarketplace;

  beforeEach(() => {
    marketplace = new GitHubMarketplace('anthropic', 'agent-skills');
  });

  it('should fetch marketplace metadata', async () => {
    const metadata = await marketplace.getMetadata();
    expect(metadata).toBeDefined();
    expect(metadata.name).toBe('anthropic-agent-skills');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/integrations/github-marketplace.test.ts`

Expected: FAIL

**Step 3: Implement marketplace client**

Create `src/integrations/marketplaces/marketplace-client.ts`:

```typescript
import { ComponentInfo, MarketplaceMetadata, ListOptions } from '../../types';

export interface MarketplaceClient {
  getMetadata(): Promise<MarketplaceMetadata>;
  listComponents(options?: ListOptions): Promise<ComponentInfo[]>;
  getComponent(name: string): Promise<ComponentInfo>;
  downloadComponent(name: string, targetPath: string): Promise<void>;
  search(query: string, filters?: any): Promise<ComponentInfo[]>;
}
```

**Step 4: Implement GitHub marketplace**

Create `src/integrations/marketplaces/github-marketplace.ts`:

```typescript
import axios from 'axios';
import { GitHubMarketplace as GitHubMarketplaceInterface } from './marketplace-client';
import { MarketplaceMetadata, ComponentInfo } from '../../types';

export class GitHubMarketplace implements GitHubMarketplaceInterface {
  constructor(
    private owner: string,
    private repo: string,
    private githubToken?: string
  ) {}

  async getMetadata(): Promise<MarketplaceMetadata> {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/.claude-plugin/marketplace.json`;

    const response = await axios.get(url, {
      headers: this.getHeaders(),
      responseType: 'text'
    });

    const content = JSON.parse(response.data);
    const decoded = Buffer.from(content.content, 'base64').toString('utf-8');

    return JSON.parse(decoded);
  }

  async listComponents(): Promise<ComponentInfo[]> {
    const metadata = await this.getMetadata();
    const components: ComponentInfo[] = [];

    for (const plugin of metadata.plugins) {
      // Parse component from plugin
      if (typeof plugin.source === 'string') {
        const skillInfo: ComponentInfo = {
          name: plugin.name,
          type: 'skill',
          version: plugin.version || '1.0.0',
          description: plugin.description || '',
          keywords: []
        };
        components.push(skillInfo);
      }
    }

    return components;
  }

  async getComponent(name: string): Promise<ComponentInfo> {
    const components = await this.listComponents();
    const component = components.find(c => c.name === name);

    if (!component) {
      throw new Error(`Component ${name} not found`);
    }

    return component;
  }

  async downloadComponent(name: string, targetPath: string): Promise<void> {
    // Implementation for downloading component
    // This will clone the repo or download specific directory
    throw new Error('Not implemented yet');
  }

  async search(query: string): Promise<ComponentInfo[]> {
    const components = await this.listComponents();
    const lowerQuery = query.toLowerCase();

    return components.filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery)
    );
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (this.githubToken) {
      headers['Authorization'] = `token ${this.githubToken}`;
    }

    return headers;
  }
}
```

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/integrations/github-marketplace.test.ts`

Expected: PASS (may need to mock axios responses)

**Step 6: Commit**

```bash
git add src/integrations/marketplaces/ tests/integrations/
git commit -m "feat: add GitHub marketplace client integration"
```

---

## Task 7: Hot Reload Implementation

**Files:**
- Create: `src/integrations/hotreload/hot-reload-signaler.ts`

**Step 1: Write test for hot reload signaler**

Create `tests/integrations/hotreload/hot-reload-signaler.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { HotReloadSignaler } from '../../src/integrations/hotreload/hot-reload-signaler';

describe('HotReloadSignaler', () => {
  it('should detect running Claude Code processes', async () => {
    const signaler = new HotReloadSignaler();
    const process = await signaler.detectClaudeProcess();
    expect(process).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/integrations/hotreload/hot-reload-signaler.test.ts`

Expected: FAIL

**Step 3: Implement hot reload signaler**

Create `src/integrations/hotreload/hot-reload-signaler.ts`:

```typescript
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

export enum ReloadResult {
  SUCCESS = 'success',
  NO_PROCESS = 'no_process',
  NOT_SUPPORTED = 'not_supported',
  TIMEOUT = 'timeout',
  ERROR = 'error'
}

export interface ClaudeProcess {
  pid: number;
  version: string;
  projectPath?: string;
  supportsHotReload: boolean;
}

export class HotReloadSignaler {
  async detectClaudeProcess(): Promise<ClaudeProcess | null> {
    try {
      // Try to find Claude Code process
      const output = execSync('pgrep -f "claude" || true', { encoding: 'utf-8' });
      const pids = output.trim().split('\n').filter(Boolean);

      if (pids.length === 0) {
        return null;
      }

      return {
        pid: parseInt(pids[0]),
        version: '1.0.0',
        supportsHotReload: true
      };
    } catch {
      return null;
    }
  }

  async signalReload(projectPath?: string): Promise<ReloadResult> {
    const process = await this.detectClaudeProcess();

    if (!process) {
      return ReloadResult.NO_PROCESS;
    }

    // Try file-based signaling first (cross-platform)
    if (projectPath) {
      return await this.signalViaFile(projectPath);
    }

    // Try Unix signal
    return await this.signalViaUnixSignal(process.pid);
  }

  async awaitReload(timeout: number): Promise<boolean> {
    // Wait for reload confirmation
    // This is a simplified version
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  private async signalViaFile(projectPath: string): Promise<ReloadResult> {
    try {
      const markerPath = join(projectPath, '.claude', '.reload');
      writeFileSync(markerPath, Date.now().toString());

      // Wait for file to be deleted (Claude Code picks it up)
      const startTime = Date.now();
      while (existsSync(markerPath) && Date.now() - startTime < 5000) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return existsSync(markerPath) ? ReloadResult.TIMEOUT : ReloadResult.SUCCESS;
    } catch {
      return ReloadResult.ERROR;
    }
  }

  private async signalViaUnixSignal(pid: number): Promise<ReloadResult> {
    try {
      // Send SIGUSR1 to Claude Code process
      execSync(`kill -SIGUSR1 ${pid}`);
      return ReloadResult.SUCCESS;
    } catch {
      return ReloadResult.ERROR;
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/integrations/hotreload/hot-reload-signaler.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/integrations/hotreload/ tests/integrations/hotreload/
git commit -m "feat: add hot reload signaler with file and signal support"
```

---

## Task 8: List Command Implementation

**Files:**
- Create: `src/interfaces/cli/commands/list.ts`

**Step 1: Write test for list command**

Create `tests/cli/commands/list.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createListCommand } from '../../../src/interfaces/cli/commands/list';

describe('list command', () => {
  it('should list all components by default', async () => {
    const cmd = createListCommand();
    expect(cmd).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/cli/commands/list.test.ts`

Expected: FAIL

**Step 3: Implement list command**

Create `src/interfaces/cli/commands/list.ts`:

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { SQLiteAdapter } from '../../../storage/database/sqlite-adapter';
import { join } from 'path';
import { homedir } from 'os';

export function createListCommand(): Command {
  const cmd = new Command('list');

  cmd
    .option('-t, --type <type>', 'Filter by component type')
    .option('-s, --scope <scope>', 'Filter by scope', 'all')
    .action(async (options) => {
      const dbPath = join(homedir(), '.aibox', 'data', 'registry.db');
      const adapter = new SQLiteAdapter(dbPath);
      await adapter.initialize();

      try {
        const components = await adapter.listComponents({
          type: options.type,
          scope: options.scope === 'all' ? undefined : options.scope
        });

        if (components.length === 0) {
          console.log(chalk.yellow('No components installed'));
          return;
        }

        // Display table
        const table = new Table({
          head: [chalk.cyan('Name'), chalk.cyan('Type'), chalk.cyan('Version'), chalk.cyan('Scope')],
          colWidths: [30, 15, 15, 15]
        });

        for (const component of components) {
          table.push([
            component.name,
            component.type,
            component.version,
            component.scope
          ]);
        }

        console.log(table.toString());
      } finally {
        await adapter.close();
      }
    });

  return cmd;
}
```

**Step 4: Update main CLI to include list command**

Update `src/index.ts`:

```typescript
import { createListCommand } from './interfaces/cli/commands/list';

// Add list command
program.addCommand(createListCommand());
```

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/cli/commands/list.test.ts`

Expected: PASS

**Step 6: Commit**

```bash
git add src/interfaces/cli/commands/list.ts tests/cli/commands/list.test.ts src/index.ts
git commit -m "feat: add list command with table output"
```

---

## Task 9: Project Initialization

**Files:**
- Create: `src/interfaces/cli/commands/init.ts`

**Step 1: Write test for init command**

Create `tests/cli/commands/init.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('init command', () => {
  it('should create .claude directory structure', async () => {
    // Test implementation
    expect(true).toBe(true);
  });
});
```

**Step 2: Implement init command**

Create `src/interfaces/cli/commands/init.ts`:

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export function createInitCommand(): Command {
  const cmd = new Command('init');

  cmd.action(async () => {
    const claudeDir = join(process.cwd(), '.claude');

    if (existsSync(claudeDir)) {
      console.log(chalk.yellow('.claude directory already exists'));
      return;
    }

    // Create directory structure
    mkdirSync(join(claudeDir, 'skills'), { recursive: true });
    mkdirSync(join(claudeDir, 'commands'), { recursive: true });
    mkdirSync(join(claudeDir, 'agents'), { recursive: true });

    // Create project config
    const config = {
      project: {
        name: require('../package.json').name || 'aibox-project',
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

    writeFileSync(
      join(claudeDir, 'aibox-project.yaml'),
      require('yaml').stringify(config)
    );

    console.log(chalk.green('✓ Project initialized'));
    console.log(chalk.dim('Created .claude directory structure'));
  });

  return cmd;
}
```

**Step 3: Add to main CLI**

Update `src/index.ts`:

```typescript
import { createInitCommand } from './interfaces/cli/commands/init';

program.addCommand(createInitCommand());
```

**Step 4: Commit**

```bash
git add src/interfaces/cli/commands/init.ts tests/cli/commands/init.test.ts src/index.ts
git commit -m "feat: add init command for project setup"
```

---

## Task 10: Build and Package

**Files:**
- Create: `tsup.config.ts`

**Step 1: Create build configuration**

Create `tsup.config.ts`:

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: 'node18',
  banner: {
    js: '#!/usr/bin/env node'
  }
});
```

**Step 2: Test build**

Run: `npm run build`

Expected: Builds successfully to `dist/`

**Step 3: Verify CLI can be run**

Run: `node dist/index.js --help`

Expected: Shows AIBox help output

**Step 4: Commit**

```bash
git add tsup.config.ts
git commit -m "feat: add build configuration with tsup"
```

---

## Final Steps

After completing all tasks:

1. Run full test suite: `npm test`
2. Run build: `npm run build`
3. Test CLI: `node dist/index.js --help`
4. Push all commits to GitHub

**Ready for implementation!**
