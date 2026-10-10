# Wardrobe Palette — UI 框架迁移开发文档

> 本文档供新 AI 会话使用。目标：将 6 个原型 HTML 的 UI **1:1 迁移**到 React Native，直接复用原型 Tailwind class，不做仿写。

---

## 一、项目背景

项目已完成功能开发（录入、衣橱浏览、搭配画布、个人中心），但当前 UI 是用 StyleSheet 仿写的，与原型差距大。需要改为**直接复用原型 HTML 的 Tailwind class**（通过 NativeWind v4 的 className），做到 1:1 还原。

---

## 二、文件位置

| 内容 | 路径 |
|------|------|
| 项目根目录 | `D:\stitch_digital_wardrobe_planner\` |
| 原型文件 | `D:\stitch_digital_wardrobe_planner\_1\` 到 `_6\` |
| 每个原型包含 | `code.html`（源码）+ `screen.png`（设计稿截图） |
| RN 项目 | `D:\stitch_digital_wardrobe_planner\mobile\` |
| 设计规范 | `D:\stitch_digital_wardrobe_planner\wardrobe_palette\DESIGN.md`（如存在） |

---

## 三、核心迁移原则

### ⚠️ 绝对不要做的事
- ❌ 不要用 StyleSheet 重写样式
- ❌ 不要"参考原型自己发挥"
- ❌ 不要改变已有业务逻辑（state、数据获取、导航、DI 等）

### ✅ 应该做的事
- ✅ 读取原型 `code.html` 源码
- ✅ 把 HTML 标签换成对应的 RN 组件
- ✅ 把 Tailwind class **原样复制**到 RN 组件的 `className` 属性
- ✅ 保留原有业务逻辑，只改 UI 层

---

## 四、HTML → RN 组件映射表

| HTML | React Native | 备注 |
|------|-------------|------|
| `<div>` | `<View>` | 最常用 |
| `<span>` / `<p>` / `<h1>` 等 | `<Text>` | RN 文本必须用 Text 包裹 |
| `<button>` | `<TouchableOpacity>` 或 `<Pressable>` | |
| `<img>` | `<Image>` | 需要 `source` 不是 `src` |
| `<input>` | `<TextInput>` | |
| `<svg>` 或 Material Symbols 图标 | `@expo/vector-icons` 的 `MaterialIcons` / `MaterialCommunityIcons` | 见下方图标处理 |
| `<ul>` / `<li>` | `<View>` | 加 flex 布局 |
| `<section>` / `<header>` / `<footer>` | `<View>` | |

### className 处理
- HTML 的 `class="xxx"` → RN 的 `className="xxx"`
- class 内容**原样复制**，不修改
- 条件 class 用模板字符串：`className={active ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`

---

## 五、tailwind.config.js（必须先更新）

原型 HTML 使用了大量自定义 design token（颜色、字号、间距），必须先更新 `mobile/tailwind.config.js`，否则 className 里的自定义 class 不生效。

**用以下内容完全替换 `D:\stitch_digital_wardrobe_planner\mobile\tailwind.config.js`**：

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        surface: '#f9f9fc',
        'surface-dim': '#dadadc',
        'surface-bright': '#f9f9fc',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f3f6',
        'surface-container': '#eeeef0',
        'surface-container-high': '#e8e8ea',
        'surface-container-highest': '#e2e2e5',
        'on-surface': '#1a1c1e',
        'on-surface-variant': '#454652',
        'inverse-surface': '#2f3133',
        'inverse-on-surface': '#f0f0f3',
        outline: '#757684',
        'outline-variant': '#c5c5d4',
        'surface-tint': '#4355b9',
        primary: '#24389c',
        'on-primary': '#ffffff',
        'primary-container': '#3f51b5',
        'on-primary-container': '#cacfff',
        'inverse-primary': '#bac3ff',
        secondary: '#52625b',
        'on-secondary': '#ffffff',
        'secondary-container': '#d5e7de',
        'on-secondary-container': '#586861',
        tertiary: '#434341',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#5b5a58',
        'on-tertiary-container': '#d4d2cf',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        'primary-fixed': '#dee0ff',
        'primary-fixed-dim': '#bac3ff',
        'on-primary-fixed': '#00105c',
        'on-primary-fixed-variant': '#293ca0',
        'secondary-fixed': '#d5e7de',
        'secondary-fixed-dim': '#b9cac2',
        'on-secondary-fixed': '#0f1e19',
        'on-secondary-fixed-variant': '#3a4a44',
        'tertiary-fixed': '#e5e2df',
        'tertiary-fixed-dim': '#c8c6c3',
        'on-tertiary-fixed': '#1c1c1a',
        'on-tertiary-fixed-variant': '#474745',
        background: '#f9f9fc',
        'on-background': '#1a1c1e',
        'surface-variant': '#e2e2e5',
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        'headline-lg-mobile': ['Manrope'],
        'display-lg': ['Manrope'],
        'title-md': ['Manrope'],
        'body-lg': ['Inter'],
        'headline-lg': ['Manrope'],
        'label-caps': ['Inter'],
        'body-sm': ['Inter'],
      },
      fontSize: {
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'display-lg': ['40px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'title-md': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '26px', fontWeight: '400' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
      },
      spacing: {
        'stack-sm': '8px',
        'stack-lg': '48px',
        'stack-md': '24px',
        unit: '4px',
        gutter: '16px',
        'container-padding-mobile': '20px',
        'container-padding-desktop': '40px',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
    },
  },
  plugins: [],
};
```

---

## 六、NativeWind v4 注意事项

NativeWind v4 将 Tailwind class 编译为 RN StyleSheet，大部分 class 可直接使用，但有以下限制：

### 不支持的 CSS 特性及替代方案

| CSS 特性 | Tailwind class | RN 替代方案 |
|---------|---------------|------------|
| backdrop-filter | `backdrop-blur-xl` 等 | 用半透明背景色近似，如 `bg-surface/80` |
| CSS Grid 瀑布流 | `masonry-grid` | 手动分两列 View，或用 `flashlist` / `masonry-list` |
| position: fixed | `fixed` | 用 `absolute` 或在 ScrollView 外层放 fixed 元素 |
| CSS 变量 | `var(--xxx)` | 不需要，token 已在 tailwind.config.js 定义 |
| `::before` / `::after` 伪元素 | 无 | 用额外的 View 实现 |
| `transition` / `animation` | `transition-*` | RN 用 `Animated` API |
| `cursor: pointer` | `cursor-pointer` | RN 不需要，TouchableOpacity 自带反馈 |
| `box-shadow` 复杂阴影 | `shadow-lg` 等 | NativeWind 支持 `shadow-*`，但效果可能不同 |

### 支持的 CSS 特性
- ✅ Flexbox（`flex`, `items-center`, `justify-center`, `gap-*` 等）
- ✅ 颜色（所有自定义 token 颜色）
- ✅ 尺寸（`w-*`, `h-*`, `aspect-[3/4]` 等）
- ✅ 圆角（`rounded-*`）
- ✅ 边距（`p-*`, `m-*` 及自定义 `px-container-padding-mobile`）
- ✅ 字号（自定义 `text-title-md` 等）
- ✅ 字重（`font-bold`, `font-semibold`）
- ✅ 透明度（`bg-surface/70`）
- ✅ 边框（`border`, `border-outline-variant/30`）

---

## 七、图标处理

原型 HTML 使用 **Material Symbols** 图标字体（Google Fonts），RN 没有这个字体。

### 替代方案：使用 `@expo/vector-icons`

项目已安装 `@expo/vector-icons`。用 `MaterialIcons` 或 `MaterialCommunityIcons` 组件替代 HTML 中的 `<span class="material-symbols">icon_name</span>`。

**HTML 原型**：
```html
<span class="material-symbols">search</span>
<span class="material-symbols">add</span>
<span class="material-symbols">person</span>
```

**RN 替代**：
```tsx
import { MaterialIcons } from '@expo/vector-icons';

<MaterialIcons name="search" size={24} color="#1a1c1e" />
<MaterialIcons name="add" size={24} color="#ffffff" />
<MaterialIcons name="person" size={24} color="#1a1c1e" />
```

### 常见图标映射

| 原型图标名 | MaterialIcons name | 用途 |
|-----------|-------------------|------|
| search | search | 搜索 |
| add | add | 添加 |
| person | person | 个人中心 |
| checkroom | checkroom | 衣橱 |
| auto_awesome | auto-awesome | 搭配 |
| close | close | 关闭 |
| arrow_back | arrow-back | 返回 |
| arrow_forward | arrow-forward | 前进 |
| favorite | favorite | 收藏 |
| favorite_border | favorite-border | 未收藏 |
| delete | delete | 删除 |
| edit | edit | 编辑 |
| more_vert | more-vert | 更多 |
| settings | settings | 设置 |
| photo_camera | photo-camera | 拍照 |
| image | image | 图片 |
| save | save | 保存 |
| tune | tune | 筛选 |
| grid_view | grid-view | 网格 |
| bookmark | bookmark | 书签 |

> 注意：如果某个图标在 MaterialIcons 中找不到，尝试 MaterialCommunityIcons。颜色用原型的 `text-*` class 对应的色值。

---

## 八、6 个屏幕迁移清单

### 屏幕对应关系

| # | 原型文件 | 目标 RN 文件 | 屏幕名称 |
|---|---------|-------------|---------|
| 1 | `_1\code.html` | `mobile\src\features\capture\CaptureTagsScreen.tsx` | 添加衣物（拍照/选图后的标签页） |
| 2 | `_2\code.html` | `mobile\src\features\outfit\OutfitCanvasScreen.tsx` | 搭配画布 |
| 3 | `_3\code.html` | `mobile\src\features\outfit\OutfitScreen.tsx` | 搭配列表 |
| 4 | `_4\code.html` | `mobile\src\features\wardrobe\WardrobeScreen.tsx` | 衣橱首页 |
| 5 | `_5\code.html` | `mobile\src\features\capture\CaptureCropScreen.tsx` | 裁剪页 |
| 6 | `_6\code.html` | `mobile\src\features\profile\ProfileScreen.tsx` | 个人中心 |

### 迁移顺序建议
1. 先更新 `tailwind.config.js`（第五节）
2. 先做 **衣橱首页 (_4)** → 验证 class 是否生效
3. 再做 **个人中心 (_6)** → 简单页面验证流程
4. 然后 **搭配列表 (_3)** → 验证列表布局
5. 然后 **添加衣物 (_1)** → 验证表单交互
6. 然后 **裁剪页 (_5)** → 注意保留 PanResponder 手势逻辑
7. 最后 **搭配画布 (_2)** → 最复杂，注意保留 PanResponder 手势逻辑

### 每个屏幕的迁移要点

#### 1. 衣橱首页 (_4 → WardrobeScreen.tsx)
- 读取 `_4\code.html` 获取完整结构
- 关键元素：顶栏品牌名（居中）、搜索栏、一级分类标签、二级筛选胶囊、瀑布流网格、FAB 添加按钮
- 瀑布流：HTML 用 CSS `masonry-grid`，RN 需手动分两列 View
- FAB：HTML 用 `position: fixed`，RN 用 `absolute`
- 保留现有逻辑：wardrobeStore 数据获取、搜索过滤、分类筛选、导航到添加衣物
- 空状态：保留现有的空状态提示

#### 2. 个人中心 (_6 → ProfileScreen.tsx)
- 读取 `_6\code.html` 获取完整结构
- 关键元素：用户头像、Bento 统计网格（总衣物数 + 各品类数）、菜单列表组
- Bento 网格：用 flex 布局实现不等大小卡片
- 保留现有逻辑：profileStore 统计数据、设置入口

#### 3. 搭配列表 (_3 → OutfitScreen.tsx)
- 读取 `_3\code.html` 获取完整结构
- 关键元素：Hero 新建卡片、场景筛选胶囊、搭配网格
- 保留现有逻辑：outfitStore 数据获取、场景筛选、导航到搭配画布

#### 4. 添加衣物 (_1 → CaptureTagsScreen.tsx)
- 读取 `_1\code.html` 获取完整结构
- 关键元素：预览图、分类选择胶囊、颜色选择器、底部渐变保存按钮
- 保留现有逻辑：图片数据传递、标签选择、保存到数据库、导航返回

#### 5. 裁剪页 (_5 → CaptureCropScreen.tsx)
- 读取 `_5\code.html` 获取完整结构
- 关键元素：三段式顶栏（取消/标题/下一步）、裁剪区域（三分线网格、四角控制点）、底部操作栏
- ⚠️ **重要**：保留现有的 `PanResponder` 手势逻辑（拖拽裁剪框、调整大小），只改 UI 外观
- 不要引入 react-native-reanimated 或 react-native-gesture-handler（会导致闪退）

#### 6. 搭配画布 (_2 → OutfitCanvasScreen.tsx)
- 读取 `_2\code.html` 获取完整结构
- 关键元素：点阵背景、人体轮廓引导、毛玻璃工具栏、底部衣物托盘
- ⚠️ **重要**：保留现有的 `PanResponder` 手势逻辑（拖拽贴纸、双指缩放），只改 UI 外观
- 不要引入 react-native-reanimated 或 react-native-gesture-handler（会导致闪退）

---

## 九、Tab 栏迁移

Tab 栏文件：`mobile\src\app\navigation\Tabs.tsx`

原型中 Tab 栏样式（毛玻璃背景、激活态胶囊高亮、emoji 图标）也需要从原型 HTML 中提取对应 class。

Tab 栏注意：
- 毛玻璃 `backdrop-blur` 不支持，用 `bg-surface/90` 近似
- 激活态用条件 className
- 图标用 emoji（原型用的 emoji）或 MaterialIcons

---

## 十、重要约束（闪退修复记录）

当前项目已修复以下闪退问题，迁移时**绝对不能 reintroduce**：

1. **不要引入 `react-native-gesture-handler`**
   - 原因：与 Expo Go SDK 57 不兼容，模块加载即崩溃
   - 替代：用 RN 原生 `PanResponder`

2. **不要引入 `react-native-reanimated`**
   - 原因：Hermes V1 + reanimated 导致内存暴增崩溃
   - 替代：用 RN 原生 `Animated` API 或 `PanResponder`

3. **必须保留 `react-native-get-random-values` polyfill**
   - 位置：`mobile\App.tsx` 最顶部
   - 原因：`uuid` 库依赖 `crypto.getRandomValues`，RN 默认不提供
   - 代码：`import 'react-native-get-random-values';`（必须是第一行 import）

4. **不要使用 `GestureHandlerRootView`**
   - 原因：gesture-handler 模块加载崩溃
   - RootApp.tsx 中不要包裹此组件

5. **metro.config.js 保持简单**
   - 不要添加 worklets Bundle Mode 配置
   - 当前正确配置：
     ```javascript
     const { getDefaultConfig } = require('expo/metro-config');
     const { withNativeWind } = require('nativewind/metro');
     const config = getDefaultConfig(__dirname);
     module.exports = withNativeWind(config, { input: './global.css' });
     ```

---

## 十一、项目架构（保留不动）

```
mobile/
├── App.tsx                      # 入口（含 polyfill）
├── app.json                     # Expo 配置
├── babel.config.js              # Babel 配置
├── metro.config.js              # Metro 配置（保持简单）
├── tailwind.config.js           # Tailwind/NativeWind 配置（需更新）
├── global.css                   # NativeWind 全局 CSS
├── package.json
└── src/
    ├── app/
    │   ├── RootApp.tsx          # 根组件（ErrorBoundary + Navigation）
    │   ├── ErrorBoundary.tsx    # 错误边界
    │   └── navigation/
    │       ├── RootStack.tsx    # Stack 导航
    │       └── Tabs.tsx         # Tab 导航（需迁移 UI）
    ├── features/
    │   ├── wardrobe/            # 衣橱模块
    │   │   ├── WardrobeScreen.tsx       # 需迁移 UI（原型 _4）
    │   │   ├── ClothingCard.tsx         # 卡片组件
    │   │   └── MasonryGrid.tsx          # 瀑布流组件
    │   ├── capture/             # 录入模块
    │   │   ├── CaptureCropScreen.tsx    # 需迁移 UI（原型 _5）
    │   │   └── CaptureTagsScreen.tsx    # 需迁移 UI（原型 _1）
    │   ├── outfit/              # 搭配模块
    │   │   ├── OutfitScreen.tsx         # 需迁移 UI（原型 _3）
    │   │   └── OutfitCanvasScreen.tsx   # 需迁移 UI（原型 _2）
    │   └── profile/             # 个人中心
    │       └── ProfileScreen.tsx        # 需迁移 UI（原型 _6）
    ├── data/                    # 数据层（不动）
    │   ├── local/               # 本地实现
    │   └── ...
    ├── infra/
    │   ├── di/                  # 依赖注入（不动）
    │   └── ...
    ├── shared/
    │   └── ui/                  # 共享 UI 组件（可按需更新）
    └── store/                   # Zustand 状态管理（不动）
```

---

## 十二、验证方法

迁移完成后：

```bash
cd D:\stitch_digital_wardrobe_planner\mobile
npx expo start --clear
```

用手机 Expo Go 扫码测试：
1. 应用能正常启动（不闪退）
2. Tab 栏样式与原型一致
3. 衣橱首页布局与原型一致
4. 各屏幕 UI 与 `screen.png` 设计稿对比
5. 添加衣物 → 裁剪 → 保存流程正常
6. 搭配画布拖拽缩放功能正常

---

## 十三、给新助手的工作流程

1. 读取本文档了解迁移原则
2. 更新 `tailwind.config.js`（第五节内容）
3. 逐个读取原型 `code.html`（从 `_4\code.html` 开始）
4. 读取对应的现有 RN 文件
5. 将 HTML 结构 1:1 迁移到 RN（class 原样复制，标签换 RN 组件）
6. 保留原有业务逻辑
7. 每完成一个屏幕，确认 TypeScript 无报错
8. 全部完成后启动 Metro 测试

### 迁移单个屏幕的步骤

```
1. Read 原型 HTML（如 _4\code.html）
2. Read 对应 RN 文件（如 WardrobeScreen.tsx）
3. 分析 HTML 结构，理清层级
4. 将 HTML 标签逐个替换为 RN 组件
5. 将 class="xxx" 改为 className="xxx"
6. 将 <svg>/<span class="material-symbols"> 替换为 MaterialIcons
7. 将业务逻辑（useEffect、store 调用、导航等）挂回新 UI
8. 处理 NativeWind 不支持的属性（backdrop-blur → 半透明背景等）
9. 确认 TypeScript 编译通过
```
