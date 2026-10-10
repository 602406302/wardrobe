# Stitch 数字衣橱 App

> 本地优先的个人衣橱管理 App · Expo + React Native

## 快速开始

### 一键安装(推荐)

**Windows(PowerShell):**
```powershell
cd mobile
.\scripts\setup.ps1
```

**macOS / Linux / WSL / Git Bash:**
```bash
cd mobile
bash scripts/setup.sh
```

脚本会自动:检查 Node → 安装依赖 → 自检 Expo CLI → 打印启动命令。

### 手动安装

如果一键脚本失败,手动执行:

```bash
# 1. 确保 Node 版本 >= 20.18.0(见 .nvmrc)
node -v
nvm use          # 如果用 nvm

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npx expo start
```

### 真机调试

1. 手机安装 **Expo Go**(iOS App Store / Android Google Play)
2. 终端执行 `npx expo start`
3. 手机扫描终端二维码,App 自动加载

## 环境要求

| 工具 | 版本 | 说明 |
|---|---|---|
| Node.js | 20.18.0+ | 见 `.nvmrc`,推荐 LTS |
| npm | 10+ | 随 Node 安装 |
| Expo Go | 最新版 | 手机端调试用 |

**可选工具**:
- `nvm` / `fnm`:Node 版本管理(跨设备切换方便)
- `Git`:版本控制
- `VS Code`:推荐 IDE,装 ESLint + Prettier 扩展

## 项目结构

```
mobile/
├── App.tsx                      # 入口
├── src/
│   ├── app/                     # 应用层(导航、入口)
│   ├── domain/                  # 领域层(实体、Repository 接口)
│   ├── data/                    # 数据层(本地实现,云端预留)
│   ├── sync/                    # 同步引擎(预留)
│   ├── features/                # 功能模块(衣橱/搭配/录入/个人中心)
│   ├── shared/                  # 共享 UI、主题、工具
│   └── infra/                   # 基础设施(DI 容器、配置、错误)
├── scripts/
│   ├── setup.ps1                # Windows 一键安装
│   └── setup.sh                 # macOS/Linux 一键安装
├── .nvmrc                       # Node 版本固定
├── package.json
└── tailwind.config.js           # NativeWind 主题(DESIGN.md token)
```

详细架构与开发指引见根目录 `DEVELOPMENT.md`。

## 换设备开发流程

1. `git clone <repo-url>`
2. `cd mobile`
3. 运行一键安装脚本(见上)
4. `npx expo start` 开始开发

## 常见问题

**Q: `npm install` 卡住或超时?**
- 切换镜像:`npm config set registry https://registry.npmmirror.com`
- 重试:`npm install --no-audit --no-fund --cache ./.npm-cache`

**Q: `npx expo start` 启动失败?**
- 检查端口 8081 是否被占用:`npx expo start --clear`
- 跑诊断:`npx expo doctor`

**Q: 手机扫码连不上?**
- 确保手机和电脑在同一 Wi-Fi
- Windows 防火墙允许 Node 通过
- 试 `npx expo start --tunnel`(穿透防火墙,速度较慢)
