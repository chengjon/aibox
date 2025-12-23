---
name: output-styles-master
description: |
  输出样式系统总览和选择指南。Claude-Kits包含8种专业输出样式，可根据不同场景和需求选择最适合的格式化方式。
  当用户询问输出格式、样式选择或需要优化信息展示方式时自动激活。
  
  支持的输出样式：
  - GenUI: 美观HTML输出
  - Table-Based: 表格数据展示  
  - YAML-Structured: 结构化配置格式
  - Ultra-Concise: 超简洁快速格式
---

# Claude-Kits 输出样式系统

Claude-Kits提供8种专业输出样式，优化不同场景下的信息展示和用户体验。

## 🎯 样式概览

| 样式名称 | 主要用途 | 最佳场景 | 特色功能 |
|----------|----------|----------|----------|
| **GenUI** | 美观HTML输出 | 技术文档、代码演示 | 完整样式、即时预览 |
| **Table-Based** | 表格数据展示 | 参数对比、状态报告 | 结构化数据、清晰对比 |
| **YAML-Structured** | 配置格式 | 设置说明、API响应 | 层次结构、可解析 |
| **Ultra-Concise** | 超简洁格式 | 快速查询、紧急处理 | 最小文本、最大效率 |
| **Bullet-Points** | 嵌套列表 | 操作项、任务跟踪 | 结构清晰、易于阅读 |
| **Markdown-Focused** | 丰富文档 | 技术说明、详细指南 | 全Markdown特性 |
| **HTML-Structured** | 语义HTML | Web文档、丰富格式 | HTML5语义标签 |
| **TTS-Summary** | 音频总结 | 任务完成、可访问性 | 语音播报、音频反馈 |

## 🚀 快速开始

### 1. 激活输出样式
```
/output-style [样式名称]
```

### 2. 常用激活命令
```bash
/output-style genui        # 激活HTML美观输出
/output-style table        # 激活表格数据输出
/output-style yaml         # 激活YAML结构化输出
/output-style concise      # 激活超简洁输出
/output-style reset        # 重置为默认样式
```

### 3. 当前样式状态
```
/output-style status       # 查看当前激活的样式
```

## 📊 详细样式说明

### 🎨 GenUI - HTML美观输出

**最佳用途**: 
- 技术文档和API说明
- 代码示例和演示
- 交互式内容展示
- 需要视觉吸引力的内容

**核心特性**:
- ✅ 完整HTML结构 + 内嵌CSS
- ✅ 代码语法高亮
- ✅ 响应式设计
- ✅ 浏览器即时预览

**使用示例**:
```
/output-style genui
请展示React组件的最佳实践示例
```

### 📋 Table-Based - 表格数据输出

**最佳用途**:
- 参数对比和选项比较
- 状态报告和进度跟踪
- 配置选项和设置清单
- 性能指标和统计数据

**核心特性**:
- ✅ 清晰的列结构
- ✅ 对齐和格式化
- ✅ 复杂表格支持
- ✅ 斑马纹提高可读性

**使用示例**:
```
/output-style table
比较不同数据库的性能指标
```

### ⚙️ YAML-Structured - 结构化配置

**最佳用途**:
- 配置文件和设置说明
- API响应和数据结构
- 部署配置和系统参数
- 分层信息和分类数据

**核心特性**:
- ✅ 层次结构清晰
- ✅ 注释支持
- ✅ 可解析格式
- ✅ 配置友好

**使用示例**:
```
/output-style yaml
生成Docker Compose配置文件
```

### ⚡ Ultra-Concise - 超简洁输出

**最佳用途**:
- 快速技术查询
- 紧急故障排除
- 日常命令参考
- 有经验用户的快速需求

**核心特性**:
- ✅ 最少词汇，最大效率
- ✅ 直接命令和代码
- ✅ 去除冗余信息
- ✅ 行动导向

**使用示例**:
```
/output-style concise
如何创建Git分支？
```

### 📝 Bullet-Points - 嵌套列表

**最佳用途**:
- 操作项和检查清单
- 步骤说明和流程
- 任务跟踪和进度
- 分类信息组织

**核心特性**:
- ✅ 结构化列表
- ✅ 多层级嵌套
- ✅ 检查框支持
- ✅ 清晰的视觉层次

### 📖 Markdown-Focused - 丰富文档

**最佳用途**:
- 复杂技术文档
- 详细的说明指南
- 混合内容展示
- 完整的项目文档

**核心特性**:
- ✅ 全Markdown特性
- ✅ 代码块和表格
- ✅ 链接和引用
- ✅ 数学公式支持

### 🌐 HTML-Structured - 语义HTML

**最佳用途**:
- Web文档和说明
- 丰富的格式要求
- 语义化结构需求
- 无障碍访问支持

**核心特性**:
- ✅ HTML5语义标签
- ✅ 无障碍属性
- ✅ 结构化数据
- ✅ SEO友好

### 🔊 TTS-Summary - 音频总结

**最佳用途**:
- 任务完成通知
- 可访问性支持
- 多任务处理
- 语音反馈需求

**核心特性**:
- ✅ 语音播报
- ✅ 音频反馈
- ✅ 任务总结
- ✅ 可访问性优化

## 🎯 样式选择指南

### 按使用场景选择

| 场景 | 推荐样式 | 原因 |
|------|----------|------|
| **技术文档** | GenUI + Markdown | 视觉吸引力 + 完整功能 |
| **数据对比** | Table-Based | 清晰的数据组织 |
| **配置说明** | YAML-Structured | 层次结构 + 可解析 |
| **快速查询** | Ultra-Concise | 最高效率 |
| **操作指南** | Bullet-Points | 结构化步骤 |
| **项目文档** | Markdown-Focused | 完整文档特性 |
| **Web内容** | HTML-Structured | 语义化结构 |
| **任务完成** | TTS-Summary | 音频反馈 |

### 按用户类型选择

| 用户类型 | 推荐样式 | 说明 |
|----------|----------|------|
| **新手用户** | Markdown-Focused | 详细说明和学习 |
| **有经验开发者** | Ultra-Concise | 快速高效 |
| **项目管理员** | Table-Based | 状态跟踪 |
| **技术写作者** | GenUI | 美观展示 |
| **运维人员** | YAML-Structured | 配置友好 |
| **团队领导** | Bullet-Points | 任务组织 |

## 🔄 样式切换

### 临时切换
```
/output-style genui          # 切换到GenUI
/output-style table          # 切换到表格
/output-style yaml           # 切换到YAML
```

### 组合使用
```
使用GenUI展示代码示例，然后用表格对比不同选项
```

### 重置默认
```
/output-style reset          # 重置为默认样式
```

## ⚙️ 配置和自定义

### 样式偏好设置
```json
{
  "output_styles": {
    "default_style": "markdown-focused",
    "preferred_styles": ["genui", "table-based"],
    "auto_detection": true
  }
}
```

### 个性化选项
- 设置常用样式为默认
- 配置样式快捷键
- 自定义样式参数
- 保存样式偏好

## 📈 最佳实践

### 1. 选择合适的样式
- 根据内容类型选择
- 考虑目标受众
- 平衡美观和效率
- 保持一致性

### 2. 组合使用
- 同一对话中可切换样式
- 不同部分使用不同样式
- 根据内容动态选择
- 提供样式建议

### 3. 用户体验
- 保持清晰的视觉层次
- 提供样式说明
- 允许用户反馈
- 持续优化

## 🔧 故障排除

### 常见问题
1. **样式不生效**: 检查激活命令格式
2. **显示异常**: 确认终端支持相应格式
3. **样式切换失败**: 重置为默认样式
4. **内容格式错误**: 检查输入内容格式

### 解决步骤
```
1. /output-style reset
2. /output-style [需要的样式]
3. 重新提交问题
```

## 📚 相关资源

- `output-styles-guide` - 详细使用指南
- `markdown-mastery` - Markdown语法参考
- `html-css-basics` - HTML/CSS基础知识
- `data-visualization` - 数据可视化技巧