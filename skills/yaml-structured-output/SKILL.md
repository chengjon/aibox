---
name: yaml-structured-output
description: |
  YAML格式的结构化输出，适合配置文件、分层数据和API响应格式。
  当需要展示配置信息、分层结构数据或需要可解析的结构化内容时自动激活。
  
  适用场景：
  - 配置文件和设置说明
  - API响应和数据结构
  - 分层信息和分类数据
  - 部署配置和系统参数
---

# YAML-Structured Output Style

YAML输出样式最适合展示配置信息、分层数据结构和可解析的结构化内容。YAML格式具有人类可读性，同时被广泛用于配置文件和数据交换。

## 核心特性

- ✅ **层次结构**：清晰展示数据的层级关系
- ✅ **配置友好**：适合配置文件和设置说明
- ✅ **数据交换**：广泛支持的数据格式
- ✅ **注释支持**：可添加说明和注释
- ✅ **类型安全**：保持数据类型信息
- ✅ **可解析**：程序可以轻松解析

## 使用方法

激活YAML输出样式：

```
/output-style yaml-structured
```

提供需要结构化展示的信息。

## YAML结构示例

```yaml
# 项目配置
project:
  name: "Claude-Kits"
  version: "3.1.0"
  description: "Claude Code组件管理系统"
  
  # 开发配置
  development:
    framework: "Claude Code"
    components: 544
    hooks: 13
    
    # 技能配置
    skills:
      total: 121
      categories:
        - backend-dev
        - frontend-dev
        - devops
        - testing
    
    # 钩子系统
    hooks_system:
      enabled: true
      types: ["UserPromptSubmit", "PostToolUse", "Stop", "SessionStart"]
      extended: ["Notification", "PreCompact"]
```

## 适用场景

### 1. 配置文件
```yaml
# 服务器配置
server:
  host: "localhost"
  port: 8080
  ssl:
    enabled: true
    cert_file: "/path/to/cert.pem"
    key_file: "/path/to/key.pem"
  
  # 数据库配置
  database:
    type: "postgresql"
    host: "db.example.com"
    port: 5432
    name: "myapp"
    pool_size: 10
```

### 2. API响应格式
```yaml
# 用户信息API响应
response:
  status: "success"
  code: 200
  data:
    user:
      id: 12345
      name: "张三"
      email: "zhangsan@example.com"
      roles: ["admin", "developer"]
      metadata:
        created_at: "2024-01-01T00:00:00Z"
        last_login: "2024-11-23T14:30:00Z"
```

### 3. 部署配置
```yaml
# Docker Compose配置
services:
  web:
    image: "nginx:alpine"
    ports:
      - "80:80"
    volumes:
      - "./nginx.conf:/etc/nginx/nginx.conf"
    environment:
      - "ENVIRONMENT=production"
  
  database:
    image: "postgres:13"
    environment:
      POSTGRES_DB: "myapp"
      POSTGRES_USER: "admin"
      POSTGRES_PASSWORD: "password123"
    volumes:
      - "db_data:/var/lib/postgresql/data"

volumes:
  db_data:
```

## YAML特性

### 1. 数据类型
- **字符串**：可省略引号
- **数字**：整数和浮点数
- **布尔值**：true/false, yes/no
- **数组**：使用列表格式
- **对象**：使用嵌套结构
- **空值**：null 或 ~

### 2. 高级特性
- **锚点和别名**：避免重复
- **多文档**：使用 --- 分隔
- **缩进敏感**：严格控制空格
- **注释**：以 # 开头

### 3. 常用模式
```yaml
# 键值对
key: value

# 数组
items:
  - name: "item1"
    value: 100
  - name: "item2"
    value: 200

# 嵌套结构
parent:
  child:
    grandchild: "value"

# 多行字符串
description: |
  这是一段多行文本
  保持原始格式
  包含换行

# 引用和别名
defaults: &default_settings
  timeout: 30
  retries: 3

service1:
  <<: *default_settings
  timeout: 60  # 覆盖默认值
```

## 与其他格式的对比

| 特性 | YAML | JSON | 表格 | 纯文本 |
|------|------|------|------|--------|
| 可读性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| 可解析性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐ |
| 配置文件 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐ |
| 数据交换 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ |
| 注释支持 | ⭐⭐⭐⭐⭐ | ❌ | ⭐ | ⭐⭐⭐⭐ |

## 最佳实践

### 1. 结构设计
- 使用有意义的键名
- 保持一致的命名约定
- 合理嵌套，避免过深层级
- 分组相关信息

### 2. 内容组织
- 提供清晰的注释
- 包含必要的说明
- 设置合理的默认值
- 标注必填和可选字段

### 3. 可维护性
- 定期更新过期信息
- 保持格式一致
- 使用注释解释复杂结构
- 版本控制和变更记录

## 实际应用场景

### 1. 系统配置
- 应用程序配置
- 服务器设置参数
- 工具和插件配置
- 环境变量管理

### 2. 数据描述
- API数据结构
- 数据库schema
- 消息格式定义
- 配置文件模板

### 3. 文档生成
- 技术文档结构
- 部署指南
- 参数说明
- 示例配置

## 工具支持

- **验证器**：在线YAML验证工具
- **格式化器**：YAML美化工具
- **转换器**：YAML与JSON互转
- **编辑器**：支持语法高亮的编辑器

## 注意事项

- YAML对缩进敏感，确保空格数正确
- 复杂的数据结构可能需要注释说明
- 避免过深的嵌套层次
- 特殊字符可能需要引号包围

## 相关技能

- `table-based-output` - 适合表格化数据
- `json-structured` - 适合编程接口
- `bullet-points` - 适合列表信息
- `configuration-templates` - 适合配置生成