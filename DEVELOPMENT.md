# Stitch 数字衣橱 App 开发文档

> 本文档为完整开发规格,供 AI / 工程师按图施工。
> 核心原则:**本地优先,一步到位做可用 App;云端与账号只留接口,本阶段不实现**。

---

## 0. 文档关系

- 业务功能:[app.md](./app.md)
- 设计系统:[wardrobe_palette/DESIGN.md](./wardrobe_palette/DESIGN.md)
- 原型页:`_1/` ~ `_6/`(Tailwind 静态 HTML)
- **本文件**:技术架构、数据模型、同步设计、开发阶段

如本文件与 app.md 冲突,以本文件为准(本文件补充并细化 app.md)。

---

## 1. 项目定位

一款本地优先的个人衣橱管理 App,核心能力:衣物录入(拍照→裁剪→抠图→打标签)、衣橱浏览筛选、搭配画布组合、个人中心管理。

- **平台**:iOS + Android(一套代码)
- **数据**:默认本地存储,完整可用;云端同步与账号系统**预留接口,本阶段不开发**
- **离线**:全功能离线可用,云端同步为增强功能

---

## 2. 技术栈

| 层 | 选型 | 版本/说明 |
|---|---|---|
| 框架 | Expo (SDK 52+) + React Native | EAS Build 打包真机 |
| 导航 | React Navigation v7 | Bottom Tabs + Native Stack |
| 本地数据库 | expo-sqlite (SQLite) | |
| ORM | Drizzle ORM | TS 优先,schema 即类型,便于未来迁 Postgres |
| 状态管理 | Zustand + persist | |
| 样式 | NativeWind v4 | 沿用原型 Tailwind |
| 拍照/选图 | expo-camera + expo-image-picker | 单次最多 9 张 |
| 图片裁剪 | expo-image-manipulator + 自绘手势裁剪框 | |
| 图片抠图 | onnxruntime-react-native + RMBG-1.4 | 本地推理,免服务器 |
| 画布手势 | react-native-gesture-handler + reanimated | |
| 画布渲染 | react-native-skia | 搭配画布高性能绘制 |
| 文件系统 | expo-file-system | 图片文件存储 |
| 安全存储 | expo-secureStore | 令牌等敏感信息 |
| 图标 | Material Symbols Outlined | 沿用原型 |
| 字体 | Manrope + Inter | 沿用设计系统 |
| 备份导出 | expo-file-system + Share API | 导出 zip(JSON+图片) |
| 云端(预留) | 接口预留,未来用 Supabase | 见 §7、§8 |

### 关键决策理由
- **Expo 而非裸 RN**:省去大量原生配置,相机/文件/ONNX 都有官方包。
- **SQLite + Drizzle**:Drizzle schema 与 Postgres 几乎一致,未来迁 Supabase 零改动。
- **ONNX 本地抠图**:免服务器、隐私好、离线可用,符合"云端只预留"原则。模型约 50MB,首次启动加载。
- **Skia 画布**:搭配画布需高频重绘,Skia 性能最优。

---

## 3. 整体架构

### 3.1 分层架构

```
┌─────────────────────────────────────────────┐
│  UI 层 (features/*/components)              │  React 组件,只管展示与交互
├─────────────────────────────────────────────┤
│  State 层 (features/*/store)                │  Zustand store,业务状态
├─────────────────────────────────────────────┤
│  UseCase 层 (features/*/usecase)            │  业务用例,编排 Repository
├─────────────────────────────────────────────┤
│  Domain 层 (domain/)                        │  实体、Repository 接口(纯类型)
├─────────────────────────────────────────────┤
│  Data 层 (data/)                            │  接口实现:local / remote(预留)
│   ├── local/   SQLite + 文件系统             │
│   └── remote/  Supabase 实现(本阶段空壳)     │
├─────────────────────────────────────────────┤
│  Sync 层 (sync/)                            │  同步引擎(接口预留,空实现)
├─────────────────────────────────────────────┤
│  Infra (infra/)                             │  依赖注入容器、配置、错误处理
└─────────────────────────────────────────────┘
```

### 3.2 目录结构

```
src/
├── app/                     # 入口
│   ├── App.tsx
│   ├── navigation/          # 导航配置
│   └── container.ts         # 依赖注入容器
├── domain/                  # 领域层(纯类型,无依赖)
│   ├── entities/
│   │   ├── Clothing.ts
│   │   ├── Tag.ts
│   │   ├── Outfit.ts
│   │   └── User.ts
│   └── repositories/        # Repository 接口定义
│       ├── IClothingRepository.ts
│       ├── ITagRepository.ts
│       ├── IOutfitRepository.ts
│       ├── IAssetStore.ts
│       ├── IAuth.ts
│       └── ISyncEngine.ts
├── data/
│   ├── local/               # 本地实现(本阶段开发)
│   │   ├── db/
│   │   │   ├── schema.ts    # Drizzle schema
│   │   │   ├── client.ts
│   │   │   └── migrations/
│   │   ├── repositories/
│   │   │   ├── SqliteClothingRepository.ts
│   │   │   ├── SqliteTagRepository.ts
│   │   │   └── SqliteOutfitRepository.ts
│   │   └── assets/
│   │       └── LocalAssetStore.ts
│   └── remote/              # 云端实现(本阶段只建空文件+TODO)
│       ├── supabase/
│       │   ├── client.ts    # TODO: 未来初始化 Supabase client
│       │   ├── SupabaseClothingRepository.ts   # 抛 NotImplemented
│       │   ├── SupabaseTagRepository.ts
│       │   ├── SupabaseOutfitRepository.ts
│       │   ├── SupabaseAssetStore.ts
│       │   └── SupabaseAuth.ts
│       └── README.md        # 说明云端实现路径,见 §7
├── sync/                    # 同步引擎(接口 + 空实现)
│   ├── ISyncEngine.ts       # 同上 domain 里也有一份,re-export
│   ├── types.ts             # SyncResult, SyncConflict, SyncStatus
│   ├── NoopSyncEngine.ts    # 本阶段用,所有方法返回 { synced: 0 }
│   └── README.md            # 同步设计说明,见 §8
├── features/
│   ├── wardrobe/            # 衣橱页
│   │   ├── components/
│   │   ├── store/
│   │   └── usecase/
│   ├── outfit/              # 搭配页(列表 + 画布)
│   ├── capture/             # 录入流程(拍照→裁剪→抠图→标签)
│   ├── canvas/              # 搭配画布(Skia)
│   └── profile/             # 个人中心
├── shared/
│   ├── ui/                  # 通用组件(Button, Chip, EmptyState...)
│   ├── theme/               # DESIGN.md token → NativeWind 配置
│   ├── hooks/
│   └── utils/
└── infra/
    ├── config.ts            # 环境变量、开关
    ├── errors.ts
    └── di/                  # 依赖注入绑定
        └── bindings.ts      # 决定用 local 还是 remote 实现
```

### 3.3 依赖注入(关键,决定本地/云端切换)

`infra/di/bindings.ts` 是切换本地/云端的唯一开关:

```ts
// 本阶段:全部绑定到 local 实现 + NoopSyncEngine
container.bind(IClothingRepository, SqliteClothingRepository);
container.bind(ITagRepository, SqliteTagRepository);
container.bind(IOutfitRepository, SqliteOutfitRepository);
container.bind(IAssetStore, LocalAssetStore);
container.bind(IAuth, LocalAnonymousAuth);       // 返回固定本地用户
container.bind(ISyncEngine, NoopSyncEngine);     // 空实现

// 未来接云端时,只需改这里:
// container.bind(IClothingRepository, SupabaseClothingRepository);
// container.bind(ISyncEngine, SupabaseSyncEngine);
```

业务代码永远从容器取接口,不直接 import 实现类。**这是"云端只留接口"的落地方式**。

---

## 4. 数据模型设计

### 4.1 设计原则(为同步准备)

所有业务表必须包含以下**同步字段**(本阶段就建好,云端同步直接用):

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | text (uuid v4) | 全局唯一,客户端生成,同步主键 |
| `created_at` | int (epoch ms) | 创建时间,客户端时间 |
| `updated_at` | int (epoch ms) | 最后修改时间,每次写更新 |
| `deleted_at` | int (epoch ms, nullable) | 软删除标记,**同步必需** |
| `version` | int | 版本号,每次写 +1,冲突检测用 |
| `owner_id` | text | 所有者用户 id,本阶段固定 `local-user` |

> **不要用自增 id**!同步会冲突。一律用客户端生成的 uuid。
> **不要硬删除**!用 `deleted_at` 软删除,否则同步无法传播删除操作。

### 4.2 表结构(Drizzle schema)

```ts
// data/local/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ============ 用户(本阶段仅本地匿名)============
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),                  // 'local-user'
  email: text('email'),                         // 云端登录后填
  displayName: text('display_name'),
  createdAt: integer('created_at'),
  // 同步字段
  updatedAt: integer('updated_at'),
  deletedAt: integer('deleted_at'),
  version: integer('version').default(0),
  ownerId: text('owner_id'),
});

// ============ 标签 ============
// 一级品类(上装/下装/配饰/鞋子/连体衣)、二级品类(长袖T/短袖T/...)
// 颜色、自定义标签 都存这张表,用 type 区分
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['category_l1', 'category_l2', 'color', 'custom'] }),
  name: text('name'),                           // 显示名
  parentId: text('parent_id'),                  // 二级品类指向一级;颜色/自定义为 null
  sortOrder: integer('sort_order').default(0),  // 用户可调顺序
  // 同步字段
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
  deletedAt: integer('deleted_at'),
  version: integer('version').default(0),
  ownerId: text('owner_id'),
});

// ============ 衣物 ============
export const clothings = sqliteTable('clothings', {
  id: text('id').primaryKey(),
  name: text('name'),                           // 用户命名,可空
  note: text('note'),                           // 备注
  imageLocalPath: text('image_local_path'),     // 本地图片相对路径
  imageRemoteUrl: text('image_remote_url'),     // 云端 URL,本阶段 null
  imageThumbPath: text('image_thumb_path'),     // 缩略图路径(瀑布流用)
  width: integer('width'),                      // 原图尺寸
  height: integer('height'),
  // 同步字段
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
  deletedAt: integer('deleted_at'),
  version: integer('version').default(0),
  ownerId: text('owner_id'),
});

// ============ 衣物-标签 多对多 ============
export const clothingTags = sqliteTable('clothing_tags', {
  id: text('id').primaryKey(),
  clothingId: text('clothing_id'),
  tagId: text('tag_id'),
  // 同步字段
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
  deletedAt: integer('deleted_at'),
  version: integer('version').default(0),
  ownerId: text('owner_id'),
});

// ============ 搭配方案 ============
export const outfits = sqliteTable('outfits', {
  id: text('id').primaryKey(),
  name: text('name'),                           // 命名
  note: text('note'),                           // 备注
  coverPath: text('cover_path'),                // 画布导出的封面图路径
  // 画布上每件衣物的摆放信息存 JSON(同步友好)
  canvasData: text('canvas_data'),              // JSON: [{clothingId, x, y, scale, rotation, zIndex}]
  // 同步字段
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
  deletedAt: integer('deleted_at'),
  version: integer('version').default(0),
  ownerId: text('owner_id'),
});

// ============ 同步游标(记录上次同步位置)============
// 本阶段建表,云端同步时用
export const syncCursors = sqliteTable('sync_cursors', {
  table: text('table_name').primaryKey(),       // 'clothings' / 'tags' / ...
  lastSyncedAt: integer('last_synced_at'),      // 上次同步的服务端时间戳
  lastSyncedVersion: integer('last_synced_version'),
});
```

### 4.3 实体关系(ER)

```
User 1───* Clothing
User 1───* Outfit
User 1───* Tag

Tag 1───* Tag            (parent_id, 二级品类→一级品类)
Tag 1───* ClothingTag *───1 Clothing
Outfit 1───* Clothing    (通过 canvasData JSON 引用 clothingId)
```

### 4.4 预设标签种子数据

首次启动写入(见 §6.3 种子):

- **category_l1**: 上装、下装、配饰、鞋子、连体衣
- **category_l2**(示例,可扩展):
  - 上装:长袖T、短袖T、衬衫长袖、衬衫短袖、卫衣、毛衣、外套、西装
  - 下装:长裤、短裤、半裙、连衣裙(可归连体衣)、运动裤、牛仔裤
  - 鞋子:运动鞋、皮鞋、靴子、凉鞋、拖鞋
  - 配饰:帽子、围巾、领带、腰带、包、首饰
- **color**: 黑、白、灰、米、红、橙、黄、绿、蓝、紫、粉、棕、花色

---

## 5. Repository 接口定义(domain 层)

所有接口在 `domain/repositories/` 定义,业务代码只依赖接口。

```ts
// domain/repositories/IClothingRepository.ts
export interface IClothingRepository {
  create(input: ClothingInput): Promise<Clothing>;
  update(id: string, patch: Partial<ClothingInput>): Promise<Clothing>;
  softDelete(id: string): Promise<void>;
  getById(id: string): Promise<Clothing | null>;
  list(filter: ClothingFilter): Promise<Clothing[]>;        // 支持标签、颜色、关键词、时间筛选
  listByIds(ids: string[]): Promise<Clothing[]>;
  // —— 同步用(本阶段接口预留,本地实现可先返回空)——
  listChangedSince(since: number): Promise<Clothing[]>;     // 增量同步用
}

// domain/repositories/IOutfitRepository.ts
export interface IOutfitRepository {
  create(input: OutfitInput): Promise<Outfit>;
  update(id: string, patch: Partial<OutfitInput>): Promise<Outfit>;
  softDelete(id: string): Promise<void>;
  getById(id: string): Promise<Outfit | null>;
  list(): Promise<Outfit[]>;
  listChangedSince(since: number): Promise<Outfit[]>;
}

// domain/repositories/ITagRepository.ts
export interface ITagRepository {
  create(input: TagInput): Promise<Tag>;
  update(id: string, patch: Partial<TagInput>): Promise<Tag>;
  softDelete(id: string): Promise<void>;
  reorder(ids: string[]): Promise<void>;                    // 拖拽排序
  list(type?: TagType): Promise<Tag[]>;
  listChangedSince(since: number): Promise<Tag[]>;
}

// domain/repositories/IAssetStore.ts  —— 图片存储抽象
export interface IAssetStore {
  save(localUri: string, filename: string): Promise<string>;  // 返回存储路径/URL
  read(path: string): Promise<string>;                         // 返回可读 uri
  delete(path: string): Promise<void>;
  getPublicUrl(path: string): Promise<string>;                 // 云端用;本地返回 file://
}

// domain/repositories/IAuth.ts  —— 账号抽象
export interface IAuth {
  currentUser(): Promise<User>;
  signIn(email: string, password: string): Promise<User>;     // 云端用
  signInAnonymously(): Promise<User>;                          // 本地用
  signOut(): Promise<void>;
  onAuthChange(cb: (u: User | null) => void): () => void;
}

// domain/repositories/ISyncEngine.ts  —— 同步引擎抽象
export interface ISyncEngine {
  status(): SyncStatus;                                        // idle/syncing/error/offline
  push(): Promise<SyncResult>;                                 // 本地→云端
  pull(): Promise<SyncResult>;                                 // 云端→本地
  sync(): Promise<SyncResult>;                                 // pull + push + 冲突解决
  onStatusChange(cb: (s: SyncStatus) => void): () => void;
}
```

---

## 6. 本地实现(本阶段开发)

### 6.1 SQLite 初始化

```ts
// data/local/db/client.ts
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const sqlite = SQLite.openDatabaseSync('wardrobe.db');
sqlite.execAsync('PRAGMA journal_mode = WAL;');   // 并发性能
sqlite.execAsync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });
```

### 6.2 迁移策略

- 用 Drizzle Kit 生成迁移 SQL
- 启动时检查并执行未应用的迁移
- 首次启动额外写入种子数据(预设标签)

### 6.3 种子数据

首次启动时,事务写入:
- 5 个 category_l1 标签
- 若干 category_l2 标签
- 13 个 color 标签
- 一个 `local-user` 用户记录

### 6.4 图片存储

```
${FileSystem.documentDirectory}wardrobe/
├── originals/        # 原图(抠图后)
│   └── {uuid}.png
├── thumbs/           # 256px 缩略图,瀑布流用
│   └── {uuid}.png
└── outfits/          # 搭配画布导出封面
    └── {uuid}.png
```

- DB 存相对路径(如 `originals/abc.png`),不存绝对路径(便于同步)
- `LocalAssetStore.read()` 拼接成 `file://` 绝对路径返回给 UI
- 录入流程:拍照 → 裁剪 → ONNX 抠图 → 生成缩略图 → 存 originals + thumbs

### 6.5 抠图实现要点

```ts
// features/capture/usecase/removeBackground.ts
import * as Onnx from 'onnxruntime-react-native';

let session: Onnx.InferenceSession | null = null;

async function getSession() {
  if (!session) {
    const modelAsset = Asset.fromModule(require('../../assets/models/rmbg-1.4.onnx'));
    await modelAsset.downloadAsync();
    session = await Onnx.InferenceSession.create(modelAsset.uri);
  }
  return session;
}

// 输入:裁剪后的图 uri → 输出:抠图后的 PNG uri(透明背景)
export async function removeBackground(imageUri: string): Promise<string> { ... }
```

- 模型文件放 `assets/models/rmbg-1.4.onnx`,约 50MB
- 首次抠图时加载 session(约 1~2 秒),之后复用
- 输入 1024x1024 resize,输出 mask 叠回原图生成透明 PNG

### 6.6 本地匿名账号

```ts
// data/local/auth/LocalAnonymousAuth.ts
export class LocalAnonymousAuth implements IAuth {
  async currentUser() {
    return { id: 'local-user', displayName: '本地用户' };
  }
  async signInAnonymously() { return this.currentUser(); }
  async signIn() { throw new Error('云端登录未开放'); }   // 预留
  async signOut() {}
  onAuthChange(cb) { cb({ id: 'local-user' }); return () => {}; }
}
```

---

## 7. 云端实现(本阶段不开发,只预留)

### 7.1 本阶段产出

`data/remote/` 目录下建好空文件,每个类实现接口但所有方法抛 `NotImplementedError`,并写明未来实现路径:

```ts
// data/remote/supabase/SupabaseClothingRepository.ts
export class SupabaseClothingRepository implements IClothingRepository {
  create(_input: ClothingInput): Promise<Clothing> {
    throw new NotImplementedError('云端实现待开发,见 DEVELOPMENT.md §7');
  }
  // ... 其余方法同上
}
```

### 7.2 未来云端方案(开发时照此执行)

**选型:Supabase**(开源 BaaS,Auth + Postgres + Storage 一套)

**表结构**:与本地 schema 一一对应,Postgres 建表,字段名转 snake_case。同步字段原样保留。

**实现步骤**(未来):
1. `supabase init`,创建项目
2. 建表(直接复用 Drizzle schema,Drizzle 支持 Postgres 方言)
3. 启用 RLS(Row Level Security),每条数据 `owner_id = auth.uid()`
4. 图片用 Supabase Storage,`SupabaseAssetStore` 上传到 bucket
5. Auth 用 Supabase Auth(邮箱/手机号/OAuth)
6. 在 `infra/di/bindings.ts` 把接口绑定切换到 Supabase 实现
7. 实现 `SupabaseSyncEngine`(见 §8)

**架构优势**:由于 Repository 接口已定义,业务代码零改动,只在 DI 容器切换绑定 + 实现 remote 类。

---

## 8. 同步引擎设计(核心,本阶段只留接口)

### 8.1 同步策略:本地优先 + 双向增量同步

```
        ┌─────────────┐         ┌─────────────┐
        │   本地 DB    │ ←─────→ │   云端 DB    │
        │  (SQLite)   │  push/  │ (Postgres)  │
        │             │  pull   │             │
        └─────────────┘         └─────────────┘
              ↑                       ↑
              │                       │
         本地读写                  多设备读写
```

**原则**:
- **本地优先**:所有读写先落本地,即时返回,不阻塞 UI
- **后台同步**:同步异步进行,失败重试,不丢数据
- **增量同步**:用 `updated_at` + `version` 游标,只同步变更
- **软删除传播**:删除只置 `deleted_at`,同步时传播

### 8.2 同步流程

```
sync() = pull() → push() → resolveConflicts()

pull():
  for each table:
    cursor = syncCursors[table]
    remoteChanges = remote.listChangedSince(cursor.lastSyncedAt)
    for each record in remoteChanges:
      local = local.getById(record.id)
      if local == null:        → 插入
      if local.version < record.version:  → 覆盖(远端更新)
      if local.version > record.version:  → 冲突,进入解决
    syncCursors[table] = 远端返回的最新时间

push():
  localChanges = local.listChangedSince(lastPushedAt)   // 含软删除
  for each record:
    remote.upsert(record)
  记录 push 游标

resolveConflicts():
  策略:最后写入胜出(LWW) + 提示用户
  → 比较 updated_at,新者胜出
  → 重要冲突(同一搭配被两设备改)可弹窗让用户选
```

### 8.3 同步接口(已定义在 §5 ISyncEngine)

### 8.4 同步数据包

push/pull 传输的记录格式:

```ts
interface SyncRecord<T> {
  table: 'clothings' | 'tags' | 'outfits' | 'clothing_tags';
  op: 'upsert' | 'delete';        // delete = 软删除
  data: T;                         // 含所有字段 + 同步字段
}
```

### 8.5 图片同步

图片不走 DB 同步,单独走 `IAssetStore`:
- push 时:检查本地有 `imageRemoteUrl == null` 的图片,上传到云端,回写 URL
- pull 时:远端有 URL 但本地无文件,下载到 `originals/`

### 8.6 本阶段产出

- `sync/NoopSyncEngine.ts`:所有方法返回 `{ synced: 0, status: 'idle' }`
- `sync/README.md`:把 §8 内容写进去,未来开发照此执行
- `syncCursors` 表建好但不写入

### 8.7 触发同步时机(未来)

- App 启动后
- 写操作后(防抖 5 秒)
- 手动点"立即同步"
- 网络从离线恢复在线时

---

## 9. 功能模块规格

> 详见 [app.md](./app.md),本节补充技术细节与边界。

### 9.1 录入流程(capture feature)

**页面流**:衣橱页 FAB → 选源(拍照/相册)→ 裁剪页 → 抠图(自动)→ 标签页 → 入库

**批量**:单次最多 9 张,逐张裁剪+抠图,最后统一打标签或每张单独打。

**裁剪页**:手势拖拽矩形框,双指缩放。底部提示"建议纯色白底,效果更佳"。提供"跳过抠图"开关。

**抠图**:默认开,可在设置里关。失败时降级为原图(带白底)。

**标签页**:
- 一级品类必选(单选)
- 二级品类可选(单选)
- 颜色可多选
- 自定义标签可多选 + 可新建
- 备注(可空)
- 名称(可空,默认用品类名+颜色)

### 9.2 衣橱浏览(wardrobe feature)

- **网格**:2 列(竖屏小屏)/ 3 列(大屏),瀑布流
- **卡片**:仅图片,16px 圆角,1px 边框;长按浮现标签
- **筛选**:顶部水平滚动 chip,支持品类+颜色+自定义多选组合
- **搜索**:匹配 name + note + 标签名
- **排序**:默认按 created_at 倒序;可切 updated_at
- **加入待搭配**:卡片右上角 + 号,加入后底部浮层显示已选数,点"完成"跳转搭配画布

### 9.3 搭配画布(canvas feature)

- **画布**:Skia Canvas,浅灰背景
- **贴纸**:每件衣物一个 Skia Image,支持拖拽、双指缩放、旋转
- **替换**:点击贴纸 → 弹出底部选衣条 → 选新衣物替换
- **删除**:长按贴纸 → 弹删除确认
- **底部选衣条**:横向滚动,高度小,带筛选 chip,美图秀秀式
- **保存**:导出画布为封面图 → 存 outfits/ → 写 DB

### 9.4 个人中心(profile feature)

- **统计**:各 category_l1 数量、搭配总数、最常用标签 Top5
- **标签管理**:列出所有标签,支持增删自定义、拖拽排序
- **主题**:亮/暗/跟随系统
- **数据**:
  - 显示本地占用空间
  - 导出备份(zip:JSON 数据 + originals 图片)
  - 导入恢复(读 zip 还原)
  - "云端同步"入口(显示"即将推出",本阶段灰显)
- **账号**:显示"本地用户",登录入口预留灰显

### 9.5 状态态规范

每个列表页都要实现:
- **空状态**:插画 + 文案 + 引导按钮(如衣橱空 → "添加第一件衣物")
- **加载态**:骨架屏
- **错误态**:文案 + 重试按钮
- **无结果态**:筛选无结果时的提示 + "清除筛选"

---

## 10. 开发阶段划分

### Phase 0 — 文档补全
- [ ] 补 app.md 的 `## ui` 章节
- [ ] 补 DESIGN.md 暗色 token + 组件状态态
- [ ] 画页面流程图(可选)

### Phase 1 — 工程脚手架
- [ ] `create-expo-app` 初始化 + TypeScript
- [ ] 装 NativeWind、Drizzle、Skia、ONNX、Navigation 等
- [ ] 搭 §3.2 目录结构
- [ ] 配 DESIGN.md token 到 NativeWind 主题
- [ ] 定义 domain 层所有接口(§5)
- [ ] 依赖注入容器 + bindings(本地绑定)
- [ ] 底部三 Tab 导航 + 空页面

### Phase 2 — 数据层
- [ ] Drizzle schema(§4.2)
- [ ] 迁移 + 种子数据(预设标签)
- [ ] SqliteClothingRepository / TagRepository / OutfitRepository
- [ ] LocalAssetStore
- [ ] LocalAnonymousAuth
- [ ] NoopSyncEngine
- [ ] data/remote/ 空壳类(抛 NotImplementedError)
- [ ] Zustand stores(persist)

### Phase 3 — 录入流程
- [ ] 拍照/选图页(最多 9 张)
- [ ] 裁剪页(手势)
- [ ] ONNX 抠图集成
- [ ] 标签选择页(预设+自定义+颜色+备注)
- [ ] 入库

### Phase 4 — 衣橱浏览
- [ ] 瀑布流网格
- [ ] 筛选条(品类+颜色+自定义)
- [ ] 搜索
- [ ] 详情/长按预览
- [ ] 加入待搭配

### Phase 5 — 搭配画布
- [ ] Skia 画布
- [ ] 贴纸拖拽/缩放/旋转
- [ ] 替换/删除
- [ ] 底部选衣条
- [ ] 保存搭配(封面导出)

### Phase 6 — 个人中心 + 收尾
- [ ] 统计页
- [ ] 标签管理(增删排序)
- [ ] 主题切换(亮/暗)
- [ ] 备份导入导出
- [ ] 真机测试
- [ ] EAS Build 打包

---

## 11. 关键技术决策备忘

| 决策点 | 选定 | 备选 | 理由 |
|---|---|---|---|
| 框架 | Expo + RN | Flutter / 裸 RN | React 生态熟,Expo 省配置 |
| 数据库 | SQLite + Drizzle | WatermelonDB / Realm | Drizzle schema 迁 Postgres 零改动,利于云端 |
| 主键 | uuid v4 | 自增 int | 同步必需,避免冲突 |
| 删除 | 软删除 | 硬删除 | 同步传播删除必需 |
| 抠图 | ONNX RMBG-1.4 本地 | remove.bg API / 不抠 | 免服务器、离线、隐私 |
| 画布 | Skia | Reanimated View | 高频重绘性能最优 |
| 云端 | Supabase(预留) | Firebase / 自建 | 开源、可自托管、Postgres 原生 |
| 同步策略 | 本地优先 + LWW | CRDT / 强一致 | 简单可靠,衣橱场景冲突少 |

---

## 12. 给后续 AI 开发的执行指引

1. **严格按分层**:UI 不碰 DB,只调 usecase;usecase 只依赖接口,不 import 实现类。
2. **实现类从 DI 容器取**:绝不在业务代码里 `new SqliteClothingRepository()`,一律 `container.get(IClothingRepository)`。
3. **写操作必填同步字段**:`id`(uuid)、`created_at`、`updated_at`、`version`(+1)、`owner_id`。删除断言 `deleted_at`。
4. **图片路径存相对**:DB 里只存 `originals/xxx.png`,读取时 `LocalAssetStore.read()` 拼 `file://`。
5. **新增表必加同步字段**,并在 `ISyncEngine` 同步范围里登记。
6. **不实现云端**:`data/remote/` 和 `sync/` 下所有方法抛 `NotImplementedError`,绝不偷偷写实现。
7. **状态态必做**:每个列表页四态(空/加载/错误/无结果)缺一不可。
8. **遵循 DESIGN.md**:颜色/字体/圆角/间距一律走 theme token,不硬编码。
9. **变更 schema 必生成迁移**:用 `drizzle-kit generate`,不手写 SQL 改表。
10. **本文件同步更新**:架构/接口/数据模型变更时,先改本文件再写代码。

---

## 附录 A:环境变量(infra/config.ts)

```ts
export const config = {
  // 云端(本阶段不启用,占位)
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  cloudEnabled: false,                          // 总开关,本阶段 false
  syncEnabled: false,                           // 同步开关,本阶段 false
  // 抠图
  bgRemovalEnabled: true,
  // 业务
  maxBatchCapture: 9,
  thumbSize: 256,
};
```

## 附录 B:依赖清单(package.json 关键项)

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-sqlite": "~14.0.0",
    "expo-file-system": "~17.0.0",
    "expo-image-picker": "~15.0.0",
    "expo-camera": "~15.0.0",
    "expo-image-manipulator": "~12.0.0",
    "expo-secure-store": "~13.0.0",
    "react-native": "0.76.x",
    "react-navigation": "^7.0.0",
    "drizzle-orm": "^0.36.0",
    "zustand": "^5.0.0",
    "nativewind": "^4.0.0",
    "@shopify/react-native-skia": "^1.x",
    "react-native-gesture-handler": "^2.x",
    "react-native-reanimated": "^3.x",
    "onnxruntime-react-native": "^1.x",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.0",
    "typescript": "^5.x",
    "tailwindcss": "^3.x"
  }
}
```
