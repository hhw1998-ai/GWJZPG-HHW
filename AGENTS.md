# AGENTS.md

## 项目概览

HHW 岗位价值评估系统 — 通用型 SaaS 工作台，基于六因素十四维度评估模型，支持 Excel 导入岗位数据、多人在线矩阵式评分、自动排名统计与导出。

- **框架**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **数据库**: Supabase (PostgreSQL)
- **UI**: shadcn/ui + Tailwind CSS 4
- **包管理**: pnpm（禁止 npm/yarn）

## 目录结构

```
src/
├── app/                      # Next.js App Router 页面与 API
│   ├── page.tsx              # Landing Page（产品介绍）
│   ├── layout.tsx            # 根布局（字体、Metadata）
│   ├── evaluation/page.tsx   # 矩阵式评分页面
│   ├── admin/page.tsx        # 管理后台（仪表盘/排名/解锁/日志/导入）
│   ├── admin-login/page.tsx  # 密码验证页
│   └── api/                  # 17 个 API 路由
│       ├── rankings/         # 排名统计（分页突破 1000 行限制）
│       ├── positions/        # 岗位列表
│       ├── companies/        # 公司列表
│       ├── evaluations/      # 评分 CRUD + 批量保存 + 提交状态
│       ├── preview-excel/    # Excel 预览校验
│       ├── confirm-import/   # 确认导入（两步流程第二步）
│       ├── import-excel/     # 直接导入
│       ├── check-data/       # 数据概览
│       ├── usage-logs/       # 使用日志（POST 公开，GET 需 token）
│       └── admin/            # 后台专用 API
│           ├── verify-password/  # 密码验证（SHA-256）
│           ├── detailed-scores/  # 详细评分矩阵
│           ├── unlock/           # 评分解锁
│           ├── operation-logs/   # 操作审计日志
│           ├── reset/            # 清空评分
│           ├── full-reset/       # 完全重置
│           ├── add-company/      # 添加公司
│           ├── init-positions/   # 初始化岗位
│           ├── generate-mock-data/ # 模拟数据
│           └── run-migration/    # 数据库迁移
├── components/
│   ├── ui/                   # shadcn/ui 组件
│   ├── logo.tsx              # Logo 组件
│   └── admin/                # 管理后台子组件
│       ├── types.ts          # 共享类型定义
│       ├── dashboard-tab.tsx # 仪表盘
│       ├── rankings-tab.tsx  # 排名 + 详细评分
│       ├── unlock-tab.tsx    # 评分解锁
│       ├── logs-tab.tsx      # 操作日志
│       └── usage-tab.tsx     # 使用日志
├── lib/
│   ├── evaluation-standards.ts  # 评估模型定义（Factor/Dimension/Level）
│   ├── position-utils.ts        # 岗位排序工具函数
│   └── excel-validator.ts       # Excel 校验（parseSheet/validateRow）
└── storage/database/
    └── supabase-client.ts   # Supabase 客户端（单例 + 懒加载）
```

## 构建与运行

```bash
pnpm install          # 安装依赖
pnpm run dev          # 开发模式（端口从 DEPLOY_RUN_PORT 环境变量读取）
pnpm run build        # 生产构建
pnpm run start        # 生产运行
```

## 数据库表

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `companies` | 公司/组织 | id, name |
| `positions` | 岗位 | id, company_id, department, name |
| `evaluators` | 评估人 | id, name (unique) |
| `evaluations` | 评分记录 | id, evaluator_id, position_id, 14 维度字段, total_score, submitted |
| `operation_logs` | 操作审计 | id, evaluator_name, operation_type, position_name, operator_name |
| `usage_logs` | 使用日志 | id, visitor_name, action, page, detail, ip_address |
| `evaluation_standards_config` | 评估标准配置 | id, config_data (JSONB) |

## 核心设计模式

### 评估模型
- 六因素十四维度，总分 1000 分
- 维度等级数 4 或 5 级，每级对应千分制分值
- 定义在 `src/lib/evaluation-standards.ts`，同时支持从数据库 `evaluation_standards_config` 读取

### Excel 导入（两步流程）
1. `preview-excel` → 解析 + 校验，返回公司列表、有效岗位、错误详情
2. `confirm-import` → 用户确认后批量写入，自动创建公司、跳过重复岗位
- 格式规范：第 1 行 A 列 = 公司名，第 5 行 = 列标题，第 6 行起 = 数据

### 批量保存优化
- upsert 评估人 → 批量 in 查询现有评分 → Promise.all 并行 insert/update
- 提交时标记 `submitted=true`，前端禁用编辑 + 后端校验

### Supabase 1000 行限制
- rankings、positions、detailed-scores 使用分页 range 循环拉取全量数据

### 密码验证
- `POST /api/admin/verify-password` 服务端 SHA-256 哈希比对
- 返回一次性 token，前端存 sessionStorage
- 使用日志 GET 需 `x-admin-token` header

## 代码风格

- TypeScript strict mode，所有函数参数必须标注类型
- 禁止 `import React from 'react'`（React 17+）
- 中文优先注释，变量/函数名英文
- 颜色使用 CSS 变量或内联 style，不硬编码 Tailwind 颜色类
- 品牌色系：深胡桃棕 `#3D3630`、琥珀金 `#C8956C`、暖白底 `#FAF8F5`

## 常见问题

### Hydration Mismatch
Next.js 16 开发模式下 React DevTools 注入 `data-inspector-*` 属性导致。在 `<html>` 加 `suppressHydrationWarning` 即可。

### Supabase RLS 策略
新建表后需添加 RLS 策略，否则匿名请求会被拦截。使用 `exec_sql` 工具执行 `CREATE POLICY`。

### 端口检测
使用 `ss -tuln | grep LISTEN` 而非 `lsof`（lsof 在 IPv6 环境下不可靠）。
