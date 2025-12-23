# AIBox - Claude Code 技能集合

## 项目概述

AIBox 是一个专门用于管理 Claude Code 的 Skills/Agents/Commands/MCP/Plugins（统称为 SACMP）的综合工具集合。该项目提供了一系列著名外部库的功能，支持管理本机、项目和用户级别的 SACMP 组件，提供管理、浏览、安装、卸载和更新等完整功能。

所有 SACMP 组件严格按照 Anthropic 和 Claude Code 的相关规范生成和操作，确保与 Claude Code 生态系统的完美兼容性。

## 项目结构

```
/opt/iflow/aibox/
├── README.md                    # 项目总体说明
├── docs/                        # 完整的中文文档集合
│   ├── overview.md             # Claude Code 概述和快速开始
│   ├── skills.md               # Agent Skills 详细指南
│   ├── plugins.md              # 插件系统完整文档
│   ├── mcp.md                  # Model Context Protocol 集成指南
│   ├── slash-commands.md       # 斜杠命令参考
│   ├── hooks.md                # Hooks 事件处理系统
│   ├── sub-agents.md           # 子代理系统文档
│   ├── plugin-marketplaces.md  # 插件市场管理
│   ├── memory.md               # 内存管理系统
│   ├── settings.md             # 配置选项详解
│   └── hooks_error_method.md   # Hooks 错误处理方法
└── skills/                      # 技能集合核心目录
    ├── README.md               # Skills 英文说明
    ├── agent_skills_spec.md    # Agent Skills 技术规范
    ├── IFLOW.md                # 技能集合概览（本文档）
    ├── .claude-plugin/         # Claude Code 插件配置
    │   └── marketplace.json    # 插件市场配置文件
    ├── template-skill/         # 技能模板
    ├── algorithmic-art/        # 算法艺术创作技能
    ├── artifacts-builder/      # 复杂 HTML 工件构建
    ├── brand-guidelines/       # 品牌指南应用
    ├── canvas-design/          # 画布设计创作
    ├── document-skills/        # 文档处理技能集合
    │   ├── docx/               # Word 文档处理
    │   ├── pdf/                # PDF 文档处理
    │   ├── pptx/               # PowerPoint 演示文稿
    │   └── xlsx/               # Excel 电子表格
    ├── internal-comms/         # 内部沟通写作
    ├── mcp-builder/            # MCP 服务器构建
    ├── skill-creator/          # 技能创建工具
    ├── slack-gif-creator/      # Slack GIF 创作
    ├── theme-factory/          # 主题样式工厂
    └── webapp-testing/         # Web 应用测试
```

## 核心功能

### 1. Skills（代理技能）

Skills 是包含指令、脚本和资源的文件夹，Claude 可以动态加载这些内容以在特定任务上表现更佳。每个技能必须包含 `SKILL.md` 文件作为入口点。

**技能类型：**
- **创意与设计**：算法艺术、画布设计、Slack GIF 创作
- **开发与技术**：工件构建、MCP 服务器生成、Web 应用测试
- **企业与沟通**：品牌指南、内部沟通、主题工厂
- **文档处理**：Word、PDF、PowerPoint、Excel 文档的高级处理

**技能规范：**
- 必须包含 YAML 前置元数据（name, description）
- 支持可选的 allowed-tools 字段限制工具访问
- 遵循严格的命名约定（小写字母和连字符）
- 支持多文件组织和脚本资源

### 2. 插件系统

插件允许通过自定义命令、代理、钩子、技能和 MCP 服务器扩展 Claude Code 功能。

**插件结构：**
```
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # 插件元数据
├── commands/                 # 自定义斜杠命令
├── agents/                   # 自定义代理
├── skills/                   # 代理技能
├── hooks/                    # 事件处理程序
└── .mcp.json                 # MCP 服务器配置
```

**插件管理：**
- 支持本地开发和团队分发
- 通过插件市场进行安装和管理
- 自动生命周期管理和环境变量支持

### 3. MCP（Model Context Protocol）

MCP 是 AI 工具集成的开源标准，允许 Claude Code 连接到数百个外部工具和数据源。

**MCP 传输类型：**
- **HTTP 服务器**：推荐的云服务连接方式
- **SSE 服务器**：Server-Sent Events（已弃用）
- **stdio 服务器**：本地进程运行，适合系统访问

**配置范围：**
- **本地范围**：项目特定，个人配置
- **项目范围**：团队共享，通过 `.mcp.json` 文件
- **用户范围**：跨项目个人配置

### 4. 斜杠命令

斜杠命令是将经常使用的提示定义为 Markdown 文件的方式，支持参数传递和 Bash 命令执行。

**命令类型：**
- **项目命令**：存储在 `.claude/commands/`，团队共享
- **个人命令**：存储在 `~/.claude/commands/`，个人使用
- **插件命令**：通过插件分发，自动集成
- **MCP 命令**：从 MCP 服务器动态发现

**高级功能：**
- 参数支持（`$ARGUMENTS`、`$1`、`$2` 等）
- Bash 命令执行（`!` 前缀）
- 文件引用（`@` 前缀）
- 思考模式触发

### 5. Hooks 事件处理

Hooks 允许在特定事件发生时自动执行命令，实现工作流程自动化。

**Hook 事件：**
- **PreToolUse/PostToolUse**：工具调用前后
- **UserPromptSubmit**：用户提交提示时
- **Notification**：通知发送时
- **SessionStart/SessionEnd**：会话开始/结束时
- **Stop/SubagentStop**：代理停止时

**配置方式：**
- JSON 配置文件（设置文件）
- 插件提供的 hooks
- 支持正则表达式匹配器
- 并行执行和超时控制

### 6. 子代理系统

子代理是专门的 AI 助手，具有自定义系统提示、工具和独立上下文窗口。

**子代理配置：**
- **项目子代理**：`.claude/agents/`，项目特定
- **用户子代理**：`~/.claude/agents/`，跨项目使用
- **插件代理**：通过插件分发
- **CLI 动态定义**：临时子代理

**功能特性：**
- 上下文保护和专业知识
- 灵活权限控制
- 自动委派和显式调用
- 模型选择控制

## 技术栈

### 核心技术
- **文档系统**：Markdown + YAML 前置元数据
- **配置管理**：JSON 配置文件
- **脚本支持**：Bash、Python、JavaScript
- **插件架构**：模块化组件系统

### Skills 特定技术
- **算法艺术**：p5.js、JavaScript、Canvas API
- **工件构建**：React 18、TypeScript、Vite、Tailwind CSS、shadcn/ui
- **文档处理**：Python 库（docx、pdfplumber、python-pptx、openpyxl）
- **Web 测试**：Playwright、Node.js

### 集成技术
- **MCP 协议**：stdio、HTTP、SSE 传输
- **OAuth 2.0**：云服务身份验证
- **环境变量扩展**：`${VAR}` 和 `${VAR:-default}` 语法
- **Git 集成**：版本控制和团队协作

## 使用指南

### 快速开始

1. **安装 Claude Code**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **导航到项目**
   ```bash
   cd your-project
   claude
   ```

3. **添加技能市场**
   ```bash
   /plugin marketplace add ./skills
   ```

4. **安装技能**
   ```bash
   /plugin install example-skills@skills
   ```

### 技能使用

**查看可用技能：**
```
What Skills are available?
```

**使用特定技能：**
```
Can you help me extract text from this PDF?  # 自动使用 PDF 技能
```

**显式调用技能：**
```
Use the algorithmic-art skill to create generative art
```

### 插件管理

**浏览插件：**
```
/plugin
```

**安装插件：**
```
/plugin install plugin-name@marketplace-name
```

**管理插件：**
```
/plugin enable/disable/uninstall plugin-name
```

### MCP 配置

**添加 HTTP 服务器：**
```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

**添加 stdio 服务器：**
```bash
claude mcp add --transport stdio airtable --env AIRTABLE_API_KEY=YOUR_KEY -- npx -y airtable-mcp-server
```

**管理服务器：**
```bash
claude mcp list
claude mcp get server-name
claude mcp remove server-name
```

### 斜杠命令

**创建命令：**
```bash
echo "Review this code for security vulnerabilities" > .claude/commands/security-review.md
```

**使用命令：**
```
/security-review
```

**带参数的命令：**
```
/fix-issue 123 high-priority
```

### Hooks 配置

**基本配置示例：**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-style.sh"
          }
        ]
      }
    ]
  }
}
```

### 子代理管理

**创建子代理：**
```
/agents
```

**使用子代理：**
```
Use the code-reviewer subagent to check my recent changes
```

## 开发约定

### 技能开发规范

1. **文件结构**：每个技能必须包含 `SKILL.md` 文件
2. **命名约定**：使用小写字母和连字符（kebab-case）
3. **元数据要求**：必须包含 name 和 description 字段
4. **工具权限**：使用 allowed-tools 限制访问
5. **文档完整性**：提供清晰的使用说明和示例

### 插件开发规范

1. **目录结构**：遵循标准插件布局
2. **配置文件**：正确配置 `plugin.json`
3. **组件集成**：无缝集成命令、代理、技能等
4. **环境变量**：使用 `${CLAUDE_PLUGIN_ROOT}` 引用路径
5. **版本管理**：语义化版本控制

### MCP 服务器规范

1. **协议兼容**：严格遵循 MCP 协议规范
2. **错误处理**：优雅的错误处理和恢复
3. **性能优化**：合理的超时和资源管理
4. **安全考虑**：输入验证和权限控制
5. **文档完整**：清晰的工具说明和使用示例

## 质量保证

### 测试策略

1. **单元测试**：核心功能的自动化测试
2. **集成测试**：组件间协作验证
3. **用户测试**：真实场景下的功能验证
4. **性能测试**：资源使用和响应时间监控

### 安全措施

1. **输入验证**：严格的输入参数验证
2. **权限控制**：最小权限原则
3. **沙箱执行**：隔离的执行环境
4. **审计日志**：完整的操作记录
5. **安全扫描**：定期安全漏洞检查

### 文档标准

1. **API 文档**：完整的接口说明
2. **用户指南**：详细的使用教程
3. **开发文档**：技术实现细节
4. **故障排除**：常见问题解决方案
5. **最佳实践**：推荐的使用模式

## 社区生态

### 贡献指南

1. **代码贡献**：遵循项目编码规范
2. **技能提交**：符合技能规范要求
3. **插件开发**：通过插件市场分发
4. **文档改进**：完善项目文档
5. **问题报告**：详细的 bug 报告

### 许可证

- **项目整体**：遵循开源许可证
- **技能组件**：Apache 2.0 许可证
- **文档技能**：源代码可用，非开源
- **第三方组件**：遵循各自许可证

### 支持渠道

1. **文档资源**：完整的中文文档集合
2. **社区论坛**：用户交流和经验分享
3. **问题追踪**：GitHub Issues
4. **示例集合**：丰富的使用示例
5. **最佳实践**：经验总结和推荐

## 未来发展

### 技术演进

1. **AI 原生应用**：更多 LLM 能力集成
2. **边缘计算**：本地化 AI 推理支持
3. **实时协作**：多用户实时功能
4. **跨平台部署**：统一的多平台体验

### 功能扩展

1. **更多编程语言**：Go、Java、C++ 支持
2. **云服务集成**：AWS、GCP、Azure 原生集成
3. **移动端支持**：iOS、Android 原生应用
4. **企业级特性**：单点登录、审计、合规性

### 生态建设

1. **开发者友好**：完善的开发工具和文档
2. **标准化推进**：行业标准制定
3. **教育普及**：学习资源和实践项目
4. **商业化支持**：企业级解决方案

---

*最后更新：2025年12月23日*  
*项目版本：1.0.0*  
*项目名称：AIBox (AIBOX/AI-Box/AI-BOX)*  
*技术栈：Markdown、JSON、Bash、Python、JavaScript、React、TypeScript*  
*应用领域：AI 工具开发、技能管理、插件系统、MCP 集成、自动化工作流*