# 项目概述

此仓库包含用于 Claude 的技能集合。技能是包含指令、脚本和资源的文件夹，Claude 可以动态加载这些内容以在特定任务上表现更佳。技能通过 `SKILL.md` 文件进行定义和配置。

## 项目结构

```
skills/
├── algorithmic-art/          # 算法艺术创作
├── artifacts-builder/        # 复杂 HTML 工件构建
├── brand-guidelines/         # 品牌指南应用
├── canvas-design/            # 画布设计创作
├── document-skills/          # 文档处理技能 (docx, pdf, pptx, xlsx)
├── internal-comms/           # 内部沟通写作
├── mcp-builder/              # MCP 服务器构建
├── skill-creator/            # 技能创建工具
├── slack-gif-creator/        # Slack GIF 创作
├── template-skill/           # 技能模板
├── theme-factory/            # 主题样式工厂
└── webapp-testing/           # Web 应用测试
```

## 核心概念

- **技能 (Skill)**: 以 `SKILL.md` 文件为核心的文件夹，包含 Claude 执行任务所需的指令和资源。
- **SKILL.md**: 技能的入口文件，包含 YAML 前置元数据和 Markdown 指令内容。

## 主要技能类别

### 创意与设计
- **algorithmic-art**: 使用 p5.js 创建生成艺术
- **canvas-design**: 使用设计哲学创建视觉艺术
- **slack-gif-creator**: 为 Slack 创建动画 GIF

### 开发与技术
- **artifacts-builder**: 使用 React/Tailwind/shadcn/ui 构建复杂工件
- **mcp-builder**: 创建 MCP 服务器集成外部服务
- **webapp-testing**: 使用 Playwright 测试 Web 应用

### 企业与沟通
- **brand-guidelines**: 应用品牌色彩和排版
- **internal-comms**: 编写内部沟通材料
- **theme-factory**: 为工件应用专业主题

### 文档处理
- **document-skills**: 处理 Word、PDF、PowerPoint 和 Excel 文档的高级技能

## 开发约定

1. 每个技能必须包含 `SKILL.md` 文件
2. 技能名称使用小写和连字符 (kebab-case)
3. 使用模板技能 (`template-skill`) 作为新技能的起点
4. 遵循 `agent_skills_spec.md` 中的规范

## 使用方法

技能可通过 Claude Code、Claude.ai 或 Claude API 使用。具体方法请参考 README.md 中的说明。