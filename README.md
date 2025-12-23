# AIBox

> Claude Code SACMP 统一管理工具

AIBox 是用于管理 Claude Code 的 **Skills/Agents/Commands/MCP/Plugins** 和 **Marketplaces**（以下统称为 "SACMP"）的统一管理工具。提供著名外部库的功能，管理本机/本项目/本用户安装的 SACMP，提供管理/浏览/安装/卸载/更新/迁移等功能。

本项目严格遵守 Anthropic 和 Claude Code 的相关规范。

## 特性

- 📦 **统一包管理** - Skills、Plugins、Commands、Agents、MCP Servers 一站式管理
- 🔄 **项目间迁移** - 支持 SACMP 组件在不同项目间的迁移
- 🎨 **交互式 TUI** - 丰富的终端用户界面，键盘导航
- 📝 **CLI 命令** - 快速直接的命令行操作
- 🔥 **热重载支持** - 安装/更新后无需重启 Claude Code
- 🔍 **智能发现** - 内置 marketplaces，支持自定义添加

## 架构设计

### 整体架构

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

### 目录结构

```
~/.aibox/                          # AIBox 主目录
├── data/                          # 数据目录
│   ├── registry.db                # SQLite 注册表（默认）
│   │   # 或使用 MongoDB（可选）
│   └── catalogs/                  # Marketplace 元数据缓存
│       ├── anthropic-agent-skills.json
│       └── custom-marketplace.json
├── components/                    # 已安装的 SACMP 组件
│   ├── skills/                    # Agent Skills
│   │   └── skill-name/
│   ├── plugins/                   # Plugins
│   │   └── plugin-name/
│   ├── commands/                  # Slash Commands
│   ├── agents/                    # Sub-Agents
│   └── mcp-servers/               # MCP Servers
├── tmp/                           # 临时下载/解压目录
└── config.yaml                    # AIBox 全局配置

项目目录 (例如 /opt/iflow/aibox/):
.claude/
├── skills/                        # 符号链接到 ~/.aibox/components/skills/*
├── commands/                      # 符号链接到 ~/.aibox/components/commands/*
└── aibox-project.yaml             # 项目级配置（记录已安装组件）
```

### 数据模型

使用 Claude 官方术语命名集合/表：

#### MongoDB Collection 设计（推荐）

```javascript
// skills 集合
{
  _id: ObjectId,
  name: "skill-name",              // 与 SKILL.md 中的 name 一致
  type: "skill",
  version: "1.0.0",
  description: "Brief description",
  source: {
    type: "marketplace|git|local|url",
    location: "path_or_url",
    marketplace: "marketplace-name"
  },
  metadata: {
    // SKILL.md 前置元数据
    allowed_tools: ["Read", "Grep"],
    // 完整的 SKILL.md 内容
  },
  scope: "user|project|local",
  project_path: "/path/to/project", // scope=project 时
  installed_at: ISODate,
  enabled: true,
  dependencies: [
    { type: "python", packages: ["pdfplumber", "pypdf"] }
  ]
}

// plugins 集合
{
  _id: ObjectId,
  name: "plugin-name",
  type: "plugin",
  version: "1.0.0",
  // ... 结构类似 skills
  components: {
    skills: ["./skills/xxx"],
    commands: ["./commands/yyy"],
    agents: ["./agents/zzz"],
    hooks: {},
    mcpServers: {}
  }
}

// commands 集合
// agents 集合
// mcp_servers 集合
// 结构类似，根据各自特性调整

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

// marketplaces 集合
{
  _id: ObjectId,
  name: "anthropic-agent-skills",
  source: {
    type: "github|git|local|url",
    location: "owner/repo or path or url"
  },
  metadata: {
    description: "Anthropic example skills",
    version: "1.0.0",
    owner: { name: "Keith Lazuka", email: "..." }
  },
  cached_at: ISODate,
  available_components: [/* 组件列表 */]
}

// migrations 集合（迁移记录）
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

#### SQLite 表设计（默认）

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
  metadata_json TEXT,              -- JSON: {allowed_tools, skill_content, ...}
  scope TEXT,                      -- user|project|local
  project_path TEXT,
  installed_at TEXT,
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 插件表 (plugins)
-- 命令表 (commands)
-- 子代理表 (sub_agents)
-- MCP 服务器表 (mcp_servers)
-- 结构类似，根据各自特性调整

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
  component_type TEXT,              -- skill|plugin|command|agent|mcp_server
  component_id TEXT,
  enabled INTEGER DEFAULT 1,
  installed_at TEXT,
  PRIMARY KEY (project_id, component_type, component_id)
);

-- Marketplaces 表
CREATE TABLE marketplaces (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  source_type TEXT,
  source_location TEXT,
  metadata_json TEXT,              -- JSON: {description, version, owner, ...}
  cached_at TEXT,
  enabled INTEGER DEFAULT 1
);

-- 迁移记录表
CREATE TABLE migrations (
  id TEXT PRIMARY KEY,
  from_project TEXT REFERENCES projects(id),
  to_project TEXT REFERENCES projects(id),
  component_type TEXT,
  component_id TEXT,
  status TEXT,                     -- pending|completed|failed
  created_at TEXT,
  completed_at TEXT,
  error_message TEXT
);

-- 依赖关系表
CREATE TABLE dependencies (
  component_type TEXT,
  component_id TEXT,
  dependency_type TEXT,            -- python|node|binary|other
  dependency_spec TEXT,            -- JSON: {package: "name", version: ">=1.0"}
  PRIMARY KEY (component_type, component_id, dependency_type, dependency_spec)
);
```

### 数据库选择

AIBox 支持两种数据库后端：

| 特性 | SQLite (默认) | MongoDB (可选) |
|------|--------------|----------------|
| 部署 | 零配置，单文件 | 需要服务运行 |
| 查询 | 基本 SQL | 强大的嵌套查询 |
| Schema | 固定，需迁移 | 灵活，无 schema |
| JSON 支持 | 文本存储 | 原生 BSON |
| 适用场景 | 个人使用、轻量级 | 团队协作、大规模 |

通过环境变量 `AIBOX_DB_TYPE=mongodb` 切换到 MongoDB。

## 核心功能

### 1. 包管理 (Package Management)

```bash
# 安装组件
aibox install skill-name@marketplace
aibox install plugin-name --scope project

# 列出已安装
aibox list
aibox list --type skills
aibox list --scope user

# 更新组件
aibox update skill-name
aibox update --all

# 卸载组件
aibox uninstall skill-name
```

### 2. 项目管理 (Project Management)

```bash
# 初始化项目
aibox init

# 查看项目状态
aibox status

# 启用/禁用组件
aibox enable skill-name
aibox disable plugin-name

# 同步项目配置
aibox sync
```

### 3. 组件迁移 (Migration)

```bash
# 迁移组件到另一个项目
aibox migrate skill-name --to-project /path/to/other/project

# 检查迁移可行性
aibox migrate --check skill-name --to-project /path/to/other/project

# 批量迁移
aibox migrate --all --from-project /current --to-project /target
```

### 4. Marketplace 管理

```bash
# 添加 marketplace
aibox marketplace add owner/repo
aibox marketplace add ./local-marketplace

# 列出 marketplaces
aibox marketplace list

# 搜索组件
aibox search pdf processing
aibox search --tag documentation
```

### 5. 交互式 TUI 模式

```bash
# 启动交互界面
aibox
# 或
aibox interactive
```

TUI 界面提供：
- 组件浏览和搜索
- 项目状态监控
- 可视化依赖关系
- 迁移向导
- 实时日志显示

## 技术栈

- **语言**: TypeScript 5.x
- **运行时**: Node.js 18+
- **数据库**: SQLite3 (better-sqlite3) / MongoDB (mongodb)
- **CLI**: Commander.js
- **TUI**: blessed 或 terminal-kit
- **HTTP**: axios
- **配置**: YAML
- **测试**: Vitest

## 安装和使用

```bash
# 全局安装
npm install -g @iflow/aibox

# 初始化
aibox init

# 添加默认 marketplace
aibox marketplace add anthropic/agent-skills

# 安装第一个 skill
aibox install pdf-processing@anthropic-agent-skills

# 启动交互模式
aibox
```

## 开发

```bash
# 克隆仓库
git clone https://github.com/iflow/aibox.git
cd aibox

# 安装依赖
npm install

# 开发模式
npm run dev

# 运行测试
npm test

# 构建
npm run build
```

## 路线图

- [ ] v0.1.0 - 核心 CLI 功能（安装、列表、卸载）
- [ ] v0.2.0 - 项目管理和迁移功能
- [ ] v0.3.0 - 交互式 TUI 界面
- [ ] v0.4.0 - 热重载支持
- [ ] v0.5.0 - MongoDB 支持
- [ ] v1.0.0 - 完整功能发布

## 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

## 许可证

MIT License - 详见 [LICENSE](./LICENSE)

## 相关链接

- [Claude Code 官方文档](https://docs.anthropic.com)
- [Agent Skills 规范](https://docs.anthropic.com/claude-code/skills)
- [Plugin 系统](https://docs.anthropic.com/claude-code/plugins)
- [MCP 协议](https://modelcontextprotocol.io)
