# 一键安装脚本(Windows PowerShell)
# 用法:在 mobile/ 目录下执行  .\scripts\setup.ps1
# 会自动:检查 Node 版本 → 安装依赖 → 检查 Expo CLI → 打印启动命令

$ErrorActionPreference = "Stop"
Set-Location -Path (Split-Path -Parent $PSScriptRoot)
Write-Host "=========================================="
Write-Host " Stitch 衣橱 App - 环境初始化(Windows)"
Write-Host "=========================================="

# 1. Node 版本检查
Write-Host "`n[1/4] 检查 Node 版本..." -ForegroundColor Cyan
$required = "20.18.0"
try {
    $current = (node -v).TrimStart('v')
} catch {
    Write-Host "未检测到 Node.js,请先安装 Node $required 或更高版本" -ForegroundColor Red
    Write-Host "下载:https://nodejs.org/dist/v$required/"
    exit 1
}
Write-Host "当前 Node 版本:$current(推荐 $required 或更高 LTS)"
if ([version]$current -lt [version]$required) {
    Write-Host "Node 版本过低,建议升级到 $required+" -ForegroundColor Yellow
}

# 2. npm 依赖
Write-Host "`n[2/4] 安装 npm 依赖(可能需 1~3 分钟)..." -ForegroundColor Cyan
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install 失败,请检查网络或手动重试" -ForegroundColor Red
    exit 1
}

# 3. Expo CLI 自检
Write-Host "`n[3/4] 检查 Expo CLI..." -ForegroundColor Cyan
npx expo --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Expo CLI 异常,请手动执行: npx expo doctor" -ForegroundColor Yellow
}

# 4. 完成
Write-Host "`n[4/4] 环境就绪!" -ForegroundColor Green
Write-Host "=========================================="
Write-Host " 启动开发服务器:"
Write-Host "   npx expo start"
Write-Host ""
Write-Host " 真机调试:"
Write-Host "   手机装 Expo Go → 扫终端二维码"
Write-Host "=========================================="
