# Stitch 数字衣橱（衣搭 Wardrobe Palette）

> 本地优先的个人衣橱管理 App · Expo + React Native

---

## 这是什么

一款帮助你管理个人衣橱的移动应用：拍照录入衣物、标签分类筛选、在画布上自由搭配组合、个人数据统计与备份。全功能离线可用，云端同步为未来预留。

## 核心功能

| 模块 | 说明 |
|---|---|
| **衣物录入** | 拍照 / 相册选图（单次最多 9 张）→ 手势裁剪 → 选择品类/颜色/自定义标签 → 入库 |
| **衣橱浏览** | 瀑布流网格、一级/二级品类筛选、颜色多选、关键词搜索、长按预览 |
| **搭配画布** | 衣物贴纸拖拽 + 双指缩放、底部选衣条、人体轮廓引导、保存搭配方案 |
| **个人中心** | 品类统计、标签管理（增删排序）、主题切换、数据备份导入/导出 |

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | **Expo SDK 57** + React Native 0.86 + React 19 |
| 导航 | React Navigation v7（Bottom Tabs + Native Stack） |
| 数据库 | expo-sqlite (SQLite) + **Drizzle ORM** |
| 状态管理 | Zustand |
| 样式 | NativeWind v4 (Tailwind CSS) |
| 图片 | expo-image-picker / expo-camera / expo-image-manipulator |
| 字体 | Manrope + Inter |
| 云端（预留） | Supabase（接口已定义，本阶段不实现） |

## 项目结构

```
stitch_digital_wardrobe_planner/
├── README.md              ← 你在这里（项目总览）
├── DEVELOPMENT.md         ← 完整技术规格（架构/数据模型/同步设计/开发阶段）
├── app.md                 ← 业务功能描述
├── UI_MIGRATION_GUIDE.md  ← UI 迁移指引
├── setup.bat              ← 一键安装脚本（双击运行）
└── mobile/                ← 代码目录
    ├── App.tsx            ← 入口
    ├── app.json           ← Expo 配置
    ├── package.json       ← 依赖清单
    ├── .nvmrc             ← Node 版本固定 (20.18.0)
    ├── scripts/
    │   ├── setup.ps1      ← Windows 安装脚本
    │   └── setup.sh       ← macOS/Linux 安装脚本
    └── src/
        ├── app/           ← 应用层（RootApp、导航、错误边界）
        ├── domain/        ← 领域层（实体定义、Repository 接口）
        ├── data/          ← 数据层（SQLite 实现 + Supabase 预留）
        ├── sync/          ← 同步引擎（接口预留，NoopSyncEngine 空实现）
        ├── features/      ← 功能模块
        │   ├── capture/   ← 录入流程（拍照→裁剪→标签）
        │   ├── wardrobe/  ← 衣橱浏览
        │   ├── outfit/    ← 搭配列表 + 画布
        │   └── profile/   ← 个人中心
        ├── shared/        ← 共享 UI 组件、主题
        └── infra/         ← 依赖注入容器、配置、错误处理
```

## 导航路由

```
RootStack (Native Stack)
├── Tabs (Bottom Tabs)
│   ├── 衣橱 (Wardrobe)      ← 瀑布流浏览、筛选、FAB 录入入口
│   ├── 搭配 (Outfit)        ← 搭配方案列表
│   └── 我的 (Profile)       ← 统计、标签管理、设置、备份
├── CaptureCamera            ← 拍照/选图（最多 9 张）
├── CaptureCrop              ← 手势裁剪
├── CaptureTags              ← 选择标签
├── OutfitCanvas             ← 搭配画布（贴纸拖拽/缩放/保存）
└── TagManage                ← 标签管理
```

## 分层架构（依赖注入）

```
UI 层 → State 层 → Domain 层（接口）→ Data 层（实现）
                                    ├── local/  SQLite（当前使用）
                                    └── remote/ Supabase（预留空壳）
```

关键设计：`infra/di/bindings.ts` 是切换本地/云端的唯一开关。业务代码永远从 DI 容器取接口，不直接 import 实现类。未来接云端只需改绑定，业务代码零改动。

## 数据模型

6 张表（均含同步字段：id(uuid)、created_at、updated_at、deleted_at、version、owner_id）：

- `users` — 本地匿名用户（local-user）
- `tags` — 标签（category_l1 / category_l2 / color / custom 四种类型）
- `clothings` — 衣物（图片路径、尺寸、备注）
- `clothing_tags` — 衣物-标签多对多
- `outfits` — 搭配方案（canvasData JSON 存放贴纸位置信息）
- `sync_cursors` — 同步游标（预留）

## 快速开始

### 一键安装（推荐）

双击根目录 `setup.bat`，或在终端执行：

```bash
# Windows
setup.bat

# macOS / Linux
cd mobile && bash scripts/setup.sh
```

### 手动安装

```bash
cd mobile
npm install        # 安装依赖
npx expo start     # 启动开发服务器
```

### 真机调试

1. 手机安装 **Expo Go**
2. 终端执行 `npx expo start`
3. 扫描终端二维码

## 环境要求

- Node.js 20.18.0+（见 `.nvmrc`）
- npm 10+
- Expo Go（手机端）

## 关键设计决策

| 决策 | 选定 | 理由 |
|---|---|---|
| 主键 | uuid v4 | 同步必需，避免冲突 |
| 删除 | 软删除（deleted_at） | 同步传播删除必需 |
| 数据库 | SQLite + Drizzle | schema 迁 Postgres 零改动，利于云端 |
| 画布手势 | RN 原生 PanResponder | Expo Go 兼容，无需额外原生依赖 |
| 云端 | Supabase（预留） | 开源、可自托管、Postgres 原生 |
| 同步策略 | 本地优先 + LWW | 简单可靠，衣橱场景冲突少 |

## 更多细节

- 完整技术规格 → [DEVELOPMENT.md](./DEVELOPMENT.md)
- 业务功能描述 → [app.md](./app.md)
- UI 迁移指引 → [UI_MIGRATION_GUIDE.md](./UI_MIGRATION_GUIDE.md)
- mobile 目录说明 → [mobile/README.md](./mobile/README.md)
