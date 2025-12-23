# AIBox Action Plan

**Created**: 2024-12-24
**Based On**: CODE_REVIEW_SUMMARY.md
**Status**: Ready for implementation

---

## Phase 1: Quick Wins (1-2 days)

### Task 1.1: Remove MongoDB Support from Types
**File**: `src/types/config.types.ts`
**Effort**: 30 minutes
**Impact**: Remove 15 LOC of unused code

```typescript
// Before:
export interface DatabaseConfig {
  type: 'sqlite' | 'mongodb';
  sqlite?: { path: string; };
  mongodb?: { uri: string; database: string; };
}

// After:
export interface DatabaseConfig {
  type: 'sqlite';
  sqlite: { path: string; };
}
```

---

### Task 1.2: Delete Unused Migration Types
**File**: `src/types/migration.types.ts`, `src/types/index.ts`
**Effort**: 15 minutes
**Impact**: Remove 35 LOC of dead code

```bash
rm src/types/migration.types.ts
# Update src/types/index.ts to remove export
```

---

### Task 1.3: Delete Unused Utility Types
**File**: `src/types/utility.types.ts`, `src/types/index.ts`
**Effort**: 15 minutes
**Impact**: Remove 15 LOC of dead code

```bash
rm src/types/utility.types.ts
# Update src/types/index.ts to remove export
# Remove tests/types/type-guards.test.ts if only testing utility types
```

---

### Task 1.4: Add Error Handling to JSON Parsing
**File**: `src/storage/database/sqlite-adapter.ts`
**Effort**: 30 minutes
**Impact**: Prevent crashes on corrupted database

```typescript
private parseMetadata(jsonString: string | null): Record<string, unknown> {
  if (!jsonString || jsonString.trim() === '') {
    return {};
  }
  try {
    return JSON.parse(jsonString) as Record<string, unknown>;
  } catch (error) {
    console.warn(`Failed to parse metadata JSON: ${error}`);
    return {};
  }
}

// Usage:
metadata: this.parseMetadata(row.metadata_json),
```

---

### Task 1.5: Add Error Handling to YAML Parsing
**File**: `src/storage/config/config-manager.ts`
**Effort**: 30 minutes
**Impact**: Graceful fallback on malformed config

```typescript
async read(scope: 'global' | 'project'): Promise<Config | ProjectConfig> {
  const configPath = this.getConfigPath(scope);

  if (!existsSync(configPath)) {
    return scope === 'global' ? DEFAULT_CONFIG : this.getDefaultProjectConfig();
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = yaml.load(content);

    if (!config || typeof config !== 'object') {
      throw new Error('Invalid config format');
    }

    return config as Config | ProjectConfig;
  } catch (error) {
    if (scope === 'global') {
      console.warn(`Failed to load config, using defaults: ${error}`);
      return DEFAULT_CONFIG;
    }
    throw new Error(`Failed to load project config: ${error}`);
  }
}
```

---

### Task 1.6: Fix Tilde Path Expansion
**File**: `src/storage/config/config-manager.ts`, `src/index.ts`
**Effort**: 45 minutes
**Impact**: Fix config file creation failure

```typescript
// In ConfigManager constructor:
import { homedir } from 'os';
import { join } from 'path';

export class ConfigManager {
  private actualConfigDir: string;

  constructor(configDir: string) {
    this.actualConfigDir = configDir.startsWith('~')
      ? join(homedir(), configDir.slice(1))
      : configDir;
  }

  private getConfigPath(scope: 'global' | 'project'): string {
    if (scope === 'global') {
      return join(this.actualConfigDir, 'config.yaml');
    }
    return join(process.cwd(), '.claude', 'aibox-project.yaml');
  }
}
```

---

## Phase 2: Critical Fixes (2-3 days)

### Task 2.1: Implement Actual Package Installer Download
**File**: `src/core/installer/package-installer.ts`
**Effort**: 1-2 days
**Impact**: Core functionality actually works

```typescript
async install(options: InstallOptions): Promise<InstalledComponent> {
  // 1. Fetch from marketplace
  const marketplace = await this.getMarketplace(options.marketplace);
  const componentInfo = await marketplace.getComponent(options.name);

  // 2. Download to temp directory
  const tmpDir = join(os.tmpdir(), `aibox-${Date.now()}`);
  await marketplace.downloadComponent(options.name, tmpDir);

  // 3. Validate
  await this.validateComponent(tmpDir);

  // 4. Move to install path
  const installPath = this.getInstallPath(options.scope);
  const componentPath = join(installPath, options.name);
  await fs.move(tmpDir, componentPath);

  // 5. Create component record
  const component: InstalledComponent = {
    id: `${options.name}-${Date.now()}`,
    name: options.name,
    type: 'skill',
    version: componentInfo.version,
    description: componentInfo.description,
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
    dependencies: componentInfo.dependencies || [],
    path: componentPath
  };

  // 6. Save to database
  await this.adapter.addComponent(component);

  return component;
}
```

---

### Task 2.2: Add Input Validation to Install Command
**File**: `src/interfaces/cli/commands/install.ts`
**Effort**: 1 hour
**Impact**: Better error messages

```typescript
.action(async (name, options) => {
  try {
    // Validate input
    if (!name || name.trim() === '') {
      console.error(chalk.red('Error: Component name is required'));
      console.log(chalk.dim('\nUsage: aibox install <name[@marketplace]> [options]'));
      process.exit(1);
    }

    const parts = name.trim().split('@');
    const componentName = parts[0];
    const marketplace = parts[1] || 'default';

    if (!componentName) {
      console.error(chalk.red('Error: Invalid component name'));
      process.exit(1);
    }

    console.log(chalk.blue(`Installing ${componentName} from ${marketplace}...`));

    const component = await installer.install({
      name: componentName,
      marketplace: marketplace,
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
```

---

### Task 2.3: Add Platform Detection for Unix Commands
**File**: `src/integrations/hotreload/hot-reload-signaler.ts`
**Effort**: 2 hours
**Impact**: Works on Windows

```typescript
import { platform } from 'os';

async detectClaudeProcess(): Promise<ClaudeProcess | null> {
  try {
    if (platform() === 'win32') {
      // Windows: use tasklist
      const output = execSync(
        'tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH',
        { encoding: 'utf-8' }
      );
      const lines = output.trim().split('\n');
      if (lines.length === 0) return null;

      // Parse CSV output to extract PID
      const match = lines[0].match(/^"node\.exe",(\d+),/);
      if (!match) return null;

      return {
        pid: parseInt(match[1]),
        version: '1.0.0',
        supportsHotReload: false // Windows doesn't support SIGUSR1
      };
    } else {
      // Unix/Linux/macOS
      const output = execSync('pgrep -f "claude" || true', { encoding: 'utf-8' });
      const pids = output.trim().split('\n').filter(Boolean);

      if (pids.length === 0) return null;

      return {
        pid: parseInt(pids[0]),
        version: '1.0.0',
        supportsHotReload: true
      };
    }
  } catch {
    return null;
  }
}
```

---

### Task 2.4: Create Error Class Hierarchy
**File**: `src/errors/index.ts` (new)
**Effort**: 2 hours
**Impact**: Better error handling

```typescript
export class AIBoxError extends Error {
  constructor(
    message: string,
    public code: string,
    public recovery?: string[]
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AIBoxError {
  constructor(field: string, message: string) {
    super(`Validation failed: ${field} - ${message}`, 'VALIDATION_ERROR');
  }
}

export class ComponentNotFoundError extends AIBoxError {
  constructor(name: string, marketplace?: string) {
    const msg = marketplace
      ? `Component "${name}" not found in marketplace "${marketplace}"`
      : `Component "${name}" not found`;
    super(msg, 'COMPONENT_NOT_FOUND', [
      'Try: aibox list',
      'Try: aibox search <query>'
    ]);
  }
}

export class InstallationError extends AIBoxError {
  constructor(name: string, cause: Error) {
    super(`Failed to install "${name}": ${cause.message}`, 'INSTALLATION_ERROR');
  }
}
```

---

## Phase 3: Architecture Improvements (1-2 days)

### Task 3.1: Consolidate SQLite Tables
**File**: `src/storage/database/sqlite-adapter.ts`
**Effort**: 2 hours
**Impact**: Remove 76 LOC of duplication

```typescript
private async createTables(): Promise<void> {
  const createComponentsTable = `
    CREATE TABLE IF NOT EXISTS components (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, name)
    )
  `;

  this.db.exec(createComponentsTable);
}

async addComponent(component: Component): Promise<void> {
  const stmt = this.db.prepare(`
    INSERT INTO components (
      type, id, name, version, description, source_type, source_location,
      marketplace, metadata_json, scope, project_path, installed_at, enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    component.type,
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
  const row = this.db.prepare(
    'SELECT * FROM components WHERE id = ?'
  ).get(id) as DbRow | undefined;

  if (!row) return null;
  return this.rowToComponent(row, row.type as ComponentType);
}

async listComponents(filter?: { type?: ComponentType; scope?: Scope }): Promise<Component[]> {
  let query = 'SELECT * FROM components';
  let params: any[] = [];

  const conditions: string[] = [];
  if (filter?.type) {
    conditions.push('type = ?');
    params.push(filter.type);
  }
  if (filter?.scope) {
    conditions.push('scope = ?');
    params.push(filter.scope);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  const rows = this.db.prepare(query).all(...params) as DbRow[];
  return rows.map(row => this.rowToComponent(row, row.type as ComponentType));
}
```

---

### Task 3.2: Centralize Path Management
**File**: `src/paths.ts` (new)
**Effort**: 1 hour
**Impact**: Remove hard-coded paths from 7+ files

```typescript
import { homedir } from 'os';
import { join } from 'path';

export const AIBOX_HOME = join(homedir(), '.aibox');
export const AIBOX_DATA = join(AIBOX_HOME, 'data');
export const REGISTRY_DB = join(AIBOX_DATA, 'registry.db');
export const COMPONENTS_DIR = join(AIBOX_HOME, 'components');

export const CLAUDE_DIR = '.claude';
export const PROJECT_CONFIG = join(CLAUDE_DIR, 'aibox-project.yaml');

export function getComponentPath(
  type: string,
  scope: 'user' | 'project' | 'local'
): string {
  if (scope === 'user') {
    return join(COMPONENTS_DIR, `${type}s`);
  }
  return join(process.cwd(), CLAUDE_DIR, `${type}s`);
}

export function getProjectPath(): string {
  return process.cwd();
}
```

Update all files to use these constants instead of hard-coded paths.

---

### Task 3.3: Fix Scope Naming Consistency
**Files**: Multiple type files
**Effort**: 30 minutes
**Impact**: Consistent naming throughout

Choose ONE convention:
- **Option A**: Use `'user' | 'project' | 'local'` everywhere
- **Option B**: Use `'global' | 'project' | 'local'` everywhere

Recommendation: Option A (matches component.types.ts).

---

## Phase 4: Testing Improvements (2-3 days)

### Task 4.1: Add Integration Tests
**Files**: `tests/integration/` (new)
**Effort**: 1 day
**Impact**: Verify real functionality

```typescript
// tests/integration/install-flow.test.ts
describe('Install Flow Integration', () => {
  it('should install component from marketplace', async () => {
    const installer = new PackageInstaller();
    const component = await installer.install({
      name: 'test-skill',
      marketplace: 'test-marketplace',
      scope: 'user'
    });

    expect(component.path).toBeDefined();
    expect(existsSync(join(component.path, 'SKILL.md'))).toBe(true);
  });
});
```

---

### Task 4.2: Add Error Path Tests
**Files**: Multiple test files
**Effort**: 1 day
**Impact**: Test error handling

---

### Task 4.3: Mock External API Calls
**Files**: `tests/mocks/` (new)
**Effort**: 1 day
**Impact**: Reliable tests without network

---

## Summary

| Phase | Tasks | Effort | Files Changed | LOC Removed |
|-------|-------|--------|---------------|-------------|
| Phase 1 | 6 tasks | 1-2 days | 7 files | ~100 LOC |
| Phase 2 | 4 tasks | 2-3 days | 5 files | 0 LOC |
| Phase 3 | 3 tasks | 1-2 days | 10+ files | ~76 LOC |
| Phase 4 | 3 tasks | 2-3 days | 10+ files | 0 LOC |
| **Total** | **16 tasks** | **6-10 days** | **30+ files** | **~176 LOC** |

---

## Implementation Order

**Week 1**: Phase 1 (Quick Wins)
**Week 2**: Phase 2 (Critical Fixes)
**Week 3**: Phase 3 (Architecture) + Phase 4 (Testing)

---

**Next Step**: Start with Task 1.1 (Remove MongoDB Support)
