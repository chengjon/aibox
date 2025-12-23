# AIBox 设计文档

**日期**: 2024-12-24
**版本**: 1.0.0
**状态**: 设计完成，待实现

---

## 概述

AIBox 是用于管理 Claude Code 的 SACMP（Skills/Agents/Commands/MCP/Plugins）的统一管理工具。提供包管理、项目间迁移、交互式 TUI 界面和热重载支持。

---

## 目录

1. [整体架构](#1-整体架构)
2. [目录结构](#2-目录结构)
3. [数据模型](#3-数据模型)
4. [核心组件](#4-核心组件)
5. [数据流](#5-数据流)
6. [错误处理](#6-错误处理)
7. [测试策略](#7-测试策略)
8. [项目结构](#8-项目结构)
9. [配置管理](#9-配置管理)
10. [热重载](#10-热重载)
11. [Marketplace 集成](#11-marketplace-集成)
12. [TUI 界面](#12-tui-界面)

---

## 1. 整体架构

AIBox 采用 TypeScript/Node.js 构建，使用分层架构：

```
┌─────────────────────────────────────────────────────────────┐
│                    Interface Layer                          │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  CLI Mode    │              │  TUI Mode    │            │
│  │  Commander.js│              │  blessed     │            │
│  └──────────────┘              └──────────────┘            │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Core Layer                              │
│  Installer │ Catalog │ Dependency │ Version │ Migration    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Storage Layer                            │
│  SQLite/MongoDB │ File System │ Symlink │ Configuration    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Integration Layer                          │
│  Marketplace Client │ SACMP Parsers │ Hot-reload Signaler  │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

- **语言**: TypeScript 5.x
- **运行时**: Node.js 18+
- **数据库**: SQLite3 (better-sqlite3) / MongoDB (mongodb)
- **CLI**: Commander.js
- **TUI**: blessed 或 terminal-kit
- **HTTP**: axios
- **配置**: YAML
- **测试**: Vitest

---

## 2. 目录结构

### 运行时目录

```
~/.aibox/                          # AIBox 主目录
├── data/                          # 数据目录
│   ├── registry.db                # SQLite 注册表（默认）
│   └── catalogs/                  # Marketplace 元数据缓存
│       ├── anthropic-agent-skills.json
│       └── custom-marketplace.json
├── components/                    # 已安装的 SACMP 组件
│   ├── skills/                    # Agent Skills
│   ├── plugins/                   # Plugins
│   ├── commands/                  # Slash Commands
│   ├── agents/                    # Sub-Agents
│   └── mcp-servers/               # MCP Servers
├── tmp/                           # 临时下载/解压目录
└── config.yaml                    # AIBox 全局配置

项目目录 (例如 /opt/iflow/aibox/):
.claude/
├── skills/                        # 符号链接到 ~/.aibox/components/skills/*
├── commands/                      # 符号链接到 ~/.aibox/components/commands/*
└── aibox-project.yaml             # 项目级配置
```

### 源代码目录

```
aibox/src/
├── index.ts                      # CLI 入口
├── core/                         # 核心业务逻辑
│   ├── installer/
│   ├── catalog/
│   ├── dependency/
│   ├── version/
│   └── migration/
├── storage/                      # 存储层
│   ├── database/
│   ├── filesystem/
│   └── config/
├── interfaces/                   # 界面层
│   ├── cli/
│   └── tui/
├── integrations/                 # 集成层
│   ├── marketplaces/
│   ├── parsers/
│   └── hotreload/
├── types/                        # 类型定义
└── utils/                        # 工具函数
```

---

## 3. 数据模型

### MongoDB Collection 设计

```javascript
// skills 集合
{
  _id: ObjectId,
  name: "skill-name",
  type: "skill",
  version: "1.0.0",
  description: "Brief description",
  source: {
    type: "marketplace|git|local|url",
    location: "path_or_url",
    marketplace: "marketplace-name"
  },
  metadata: {
    allowed_tools: ["Read", "Grep"],
    skill_content: "..."
  },
  scope: "user|project|local",
  project_path: "/path/to/project",
  installed_at: ISODate,
  enabled: true,
  dependencies: [
    { type: "python", packages: ["pdfplumber", "pypdf"] }
  ]
}

// projects 集合
{
  _id: ObjectId,
  path: "/opt/iflow/aibox",
  name: "aibox",
  last_sync_at: ISODate,
  components: {
    skills: ["skill-id-1", "skill-id-2"],
    plugins: ["plugin-id-1"],
    commands: ["command-id-1"]
  }
}

// migrations 集合
{
  _id: ObjectId,
  from_project: ObjectId,
  to_project: ObjectId,
  component_id: ObjectId,
  component_type: "skill|plugin|command|agent|mcp_server",
  status: "pending|completed|failed",
  created_at: ISODate,
  completed_at: ISODate,
  error_message: ""
}
```

### SQLite 表设计

```sql
-- 技能表
CREATE TABLE skills (
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
);

-- 项目表
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  name TEXT,
  last_sync_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 项目组件关联表
CREATE TABLE project_components (
  project_id TEXT REFERENCES projects(id),
  component_type TEXT,
  component_id TEXT,
  enabled INTEGER DEFAULT 1,
  installed_at TEXT,
  PRIMARY KEY (project_id, component_type, component_id)
);

-- 迁移记录表
CREATE TABLE migrations (
  id TEXT PRIMARY KEY,
  from_project TEXT REFERENCES projects(id),
  to_project TEXT REFERENCES projects(id),
  component_type TEXT,
  component_id TEXT,
  status TEXT,
  created_at TEXT,
  completed_at TEXT,
  error_message TEXT
);
```

---

## 4. 核心组件

### PackageInstaller

```typescript
interface PackageInstaller {
  install(name: string, source: Source, options: InstallOptions): Promise<InstalledComponent>;
  uninstall(componentId: string, options: UninstallOptions): Promise<void>;
  update(componentId: string, options: UpdateOptions): Promise<InstalledComponent>;
  validate(componentPath: string): Promise<ValidationResult>;
}

interface Source {
  type: 'marketplace' | 'git' | 'local' | 'url';
  location: string;
  ref?: string;
}

interface InstallOptions {
  scope: 'user' | 'project' | 'local';
  force?: boolean;
  skipDeps?: boolean;
  hotReload?: boolean;
}
```

### MigrationManager

```typescript
interface MigrationManager {
  analyze(componentId: string, fromProject: string, toProject: string): Promise<MigrationAnalysis>;
  migrate(componentId: string, fromProject: string, toProject: string, options: MigrationOptions): Promise<MigrationResult>;
  migrateBatch(componentIds: string[], fromProject: string, toProject: string): Promise<MigrationResult[]>;
  rollback(migrationId: string): Promise<void>;
}

interface MigrationAnalysis {
  canMigrate: boolean;
  conflicts: Conflict[];
  missingDependencies: Dependency[];
  requiredChanges: string[];
}

interface Conflict {
  type: 'name' | 'dependency' | 'config';
  severity: 'error' | 'warning' | 'info';
  message: string;
  resolution?: string;
}
```

---

## 5. 数据流

### 安装流程

```
用户命令 → CatalogManager (查询目录) → DependencyResolver (解析依赖)
    → PackageInstaller (执行安装) → HotReloadSignaler (触发重载)
```

### 迁移流程

```
用户命令 → ScopeAnalyzer (分析作用域) → ConflictDetector (冲突检测)
    → 用户确认 → MigrationExecutor (执行迁移) → HotReloadSignaler (通知)
```

---

## 6. 错误处理

### 错误分类

```typescript
enum ErrorType {
  NETWORK_ERROR,          // 网络错误
  PARSE_ERROR,            // 解析错误
  VALIDATION_ERROR,       // 验证错误
  DEPENDENCY_ERROR,       // 依赖错误
  CONFLICT_ERROR,         // 冲突错误
  PERMISSION_ERROR,       // 权限错误
  STORAGE_ERROR,          // 存储错误
  MIGRATION_ERROR         // 迁移错误
}

interface AIBoxError {
  type: ErrorType;
  code: string;
  message: string;
  details?: any;
  recovery?: string[];
}
```

### 边界情况

1. **网络中断** - 支持断点续传或使用缓存
2. **依赖冲突** - 提示用户并询问处理方式
3. **并发操作** - 使用文件锁队列化
4. **磁盘空间** - 预检查并清理临时文件
5. **迁移边界** - 验证路径和修复符号链接

---

## 7. 测试策略

### 测试层级

```
E2E Tests
    ↓
Integration Tests
    ↓
Unit Tests
```

### 测试示例

```typescript
// 单元测试
describe('PackageInstaller', () => {
  it('should install skill from marketplace', async () => {
    const result = await installer.install('pdf-processing', mockSource);
    expect(result.name).toBe('pdf-processing');
  });
});

// 集成测试
describe('Migration Integration', () => {
  it('should migrate skill between projects', async () => {
    const result = await migrationManager.migrate('test-skill', sourcePath, targetPath);
    expect(result.status).toBe('completed');
  });
});

// E2E 测试
describe('E2E: Install and Migrate', () => {
  it('should complete full workflow', async () => {
    await exec('aibox install test-skill@demo-marketplace');
    await exec('aibox migrate test-skill --to-project /tmp/test-project');
    const list = await exec('aibox list --project /tmp/test-project');
    expect(list).toContain('test-skill');
  });
});
```

---

## 8. 项目结构

见第 2 节"源代码目录"。

### 关键类型

```typescript
// component.types.ts
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

// migration.types.ts
export interface MigrationPlan {
  componentId: string;
  fromProject: string;
  toProject: string;
  conflicts: Conflict[];
  requiredChanges: string[];
  canProceed: boolean;
}
```

---

## 9. 配置管理

### 全局配置 (~/.aibox/config.yaml)

```yaml
version: "1.0"

database:
  type: sqlite
  sqlite:
    path: ~/.aibox/data/registry.db

defaultScope: user

builtinMarketplaces:
  - name: anthropic-agent-skills
    source:
      type: github
      location: anthropic/agent-skills
    enabled: true

cache:
  ttl: 3600
  maxSize: 100

hotReload:
  enabled: true
  signal: SIGUSR1

cli:
  outputFormat: pretty
  colorOutput: true
  confirmBeforeInstall: true
```

### 项目配置 (.claude/aibox-project.yaml)

```yaml
project:
  name: aibox
  version: 0.1.0

lock:
  skills:
    - name: pdf-processing
      version: 1.0.0
      enabled: true

settings:
  autoSync: true
  hotReload: true
  scope: project
```

---

## 10. 热重载

### 实现方案

#### 方案 1: Unix Signal（推荐）

```typescript
async function signalReloadUnix(): Promise<ReloadResult> {
  const process = await detectClaudeProcess();
  if (!process) return ReloadResult.NO_PROCESS;

  process.kill(process.pid, 'SIGUSR1');
  return await awaitReload(5000);
}
```

#### 方案 2: 文件标记（fallback）

```typescript
async function signalReloadFile(): Promise<ReloadResult> {
  const markerPath = path.join(projectPath, '.claude', '.reload');
  await fs.writeFile(markerPath, Date.now().toString());
  return await waitForFileDeletion(markerPath, 5000);
}
```

#### 方案 3: Socket 通信（未来）

```typescript
async function signalReloadSocket(): Promise<ReloadResult> {
  const socket = new net.Socket();
  return new Promise((resolve) => {
    socket.connect('/tmp/claude-code.sock', () => {
      socket.write(JSON.stringify({ type: 'reload' }));
      resolve(ReloadResult.SUCCESS);
    });
  });
}
```

### 与 Claude Code 集成

需要在 Claude Code 中添加：

```javascript
// 信号监听
process.on('SIGUSR1', () => {
  reloadComponents();
});

// 文件监听
chokidar.watch('.claude/.reload').on('change', () => {
  reloadComponents();
  fs.unlink('.claude/.reload');
});
```

---

## 11. Marketplace 集成

### 抽象接口

```typescript
interface MarketplaceClient {
  getMetadata(): Promise<MarketplaceMetadata>;
  listComponents(options?: ListOptions): Promise<ComponentInfo[]>;
  getComponent(name: string): Promise<ComponentInfo>;
  downloadComponent(name: string, targetPath: string): Promise<void>;
  search(query: string, filters?: SearchFilters): Promise<ComponentInfo[]>;
  refresh(): Promise<void>;
}
```

### GitHub Marketplace

```typescript
class GitHubMarketplace implements MarketplaceClient {
  constructor(owner: string, repo: string, githubToken?: string) {}

  async getMetadata(): Promise<MarketplaceMetadata> {
    const content = await this.fetchFile('.claude-plugin/marketplace.json');
    return JSON.parse(content);
  }

  async downloadComponent(name: string, targetPath: string): Promise<void> {
    const component = await this.getComponent(name);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aibox-'));

    if (component.source.type === 'github') {
      await this.cloneRepo(component.source.location, tmpDir);
    }

    await this.validateComponent(tmpDir);
    await fs.move(tmpDir, targetPath);
  }
}
```

### 本地 Marketplace

```typescript
class LocalMarketplace implements MarketplaceClient {
  constructor(rootPath: string) {}

  async listComponents(): Promise<ComponentInfo[]> {
    const metadata = await this.getMetadata();
    const components: ComponentInfo[] = [];

    for (const plugin of metadata.plugins) {
      const componentPath = path.join(this.rootPath, plugin.source);
      const skillPath = path.join(componentPath, 'SKILL.md');

      if (await fs.pathExists(skillPath)) {
        const content = await fs.readFile(skillPath, 'utf-8');
        components.push(this.parseSkillMarkdown(content));
      }
    }

    return components;
  }
}
```

---

## 12. TUI 界面

### 主界面

```
┌──────────────────────────────────────────────────────────────────┐
│  AIBox v0.1.0                                      [?] 帮助  [q] 退出 │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────────────────────────────────┐  │
│  │   组件类型    │  │  已安装组件 (12)                          │  │
│  │             │  │                                          │  │
│  │ [ ] Skills  │  │  ▼ pdf-processing              v1.0.0     │  │
│  │ [ ] Plugins │  │  ▼ docx-tools                 v2.1.0     │  │
│  │ [ ] Commands│  │  ▼ pptx-tools                 v1.5.0     │  │
│  │ [ ] Agents  │  │                                          │  │
│  │ [ ] MCP     │  │                                          │  │
│  └─────────────┘  └──────────────────────────────────────────┘  │
│                                                                  │
│  操作: [i]安装  [u]更新  [m]迁移  [r]移除  [Enter]详情           │
└──────────────────────────────────────────────────────────────────┘
```

### TUI 组件

```typescript
class HomeScreen extends Screen {
  private componentList: ComponentListWidget;
  private typeFilter: TypeFilterWidget;
  private actionBar: ActionBarWidget;

  init() {
    this.componentList = new ComponentListWidget({
      parent: this,
      top: 1,
      left: 20,
      width: '50%',
      height: '70%',
      keys: true,
      mouse: true
    });

    this.actionBar = new ActionBarWidget({
      actions: [
        { key: 'i', label: '安装', handler: () => this.showInstallScreen() },
        { key: 'u', label: '更新', handler: () => this.updateSelected() },
        { key: 'm', label: '迁移', handler: () => this.showMigrateScreen() }
      ]
    });
  }
}
```

---

## 路线图

- [ ] v0.1.0 - 核心 CLI 功能（安装、列表、卸载）
- [ ] v0.2.0 - 项目管理和迁移功能
- [ ] v0.3.0 - 交互式 TUI 界面
- [ ] v0.4.0 - 热重载支持
- [ ] v0.5.0 - MongoDB 支持
- [ ] v1.0.0 - 完整功能发布

---

**文档结束**
