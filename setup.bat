@echo off
chcp 65001 >nul 2>&1
setlocal

REM ============================================================
REM  Stitch 数字衣橱 App - 一键安装脚本 (Windows)
REM  双击运行即可：检查 Node → 安装依赖 → 自检 Expo → 打印启动命令
REM ============================================================

cd /d "%~dp0mobile"

echo.
echo ==========================================
echo  Stitch 衣橱 App - 环境初始化
echo ==========================================

REM 1. Node 版本检查
echo.
echo [1/4] 检查 Node 版本...
where node >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node 20.18.0 或更高版本
    echo        下载: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo        当前 Node 版本: %NODE_VER%

REM 2. 安装 npm 依赖
echo.
echo [2/4] 安装 npm 依赖（可能需 1~3 分钟）...
echo        如果卡住可按 Ctrl+C 停止，然后手动切换镜像:
echo        npm config set registry https://registry.npmmirror.com
echo.
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo.
    echo [错误] npm install 失败
    echo        尝试切换镜像后重试:
    echo        npm config set registry https://registry.npmmirror.com
    echo        然后重新运行此脚本
    echo.
    pause
    exit /b 1
)

REM 3. Expo CLI 自检
echo.
echo [3/4] 检查 Expo CLI...
call npx expo --version
if errorlevel 1 (
    echo        [警告] Expo CLI 异常，请手动执行: npx expo doctor
)

REM 4. 完成
echo.
echo [4/4] 环境就绪!
echo ==========================================
echo  启动开发服务器:
echo     npx expo start
echo.
echo  真机调试:
echo     手机装 Expo Go → 扫终端二维码
echo ==========================================
echo.
echo 脚本执行完毕。要现在启动开发服务器吗？(Y/N)
set /p CHOICE=
if /i "%CHOICE%"=="Y" (
    call npx expo start
)
pause
