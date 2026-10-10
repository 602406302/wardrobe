#!/usr/bin/env bash
# 一键安装脚本(macOS / Linux / WSL / Git Bash)
# 用法:在 mobile/ 目录下执行  bash scripts/setup.sh
# 会自动:检查 Node 版本 → 安装依赖 → 检查 Expo CLI → 打印启动命令

set -e
cd "$(dirname "$0")/.."

echo "=========================================="
echo " Stitch 衣橱 App - 环境初始化(macOS/Linux)"
echo "=========================================="

# 1. Node 版本检查
echo -e "\n[1/4] 检查 Node 版本..."
REQUIRED="20.18.0"
if ! command -v node &> /dev/null; then
    echo "未检测到 Node.js,请先安装 Node $REQUIRED 或更高版本"
    echo "  macOS:  brew install node@20"
    echo "  Linux:  参考 https://nodejs.org/en/download/"
    echo "  或用 nvm:nvm install $REQUIRED"
    exit 1
fi
CURRENT=$(node -v | sed 's/v//')
echo "当前 Node 版本:$CURRENT(推荐 $REQUIRED 或更高 LTS)"

# 2. npm 依赖
echo -e "\n[2/4] 安装 npm 依赖(可能需 1~3 分钟)..."
npm install --no-audit --no-fund

# 3. Expo CLI 自检
echo -e "\n[3/4] 检查 Expo CLI..."
npx expo --version || echo "Expo CLI 异常,请手动执行: npx expo doctor"

# 4. 完成
echo -e "\n[4/4] 环境就绪!"
echo "=========================================="
echo " 启动开发服务器:"
echo "   npx expo start"
echo ""
echo " 真机调试:"
echo "   手机装 Expo Go → 扫终端二维码"
echo "=========================================="
