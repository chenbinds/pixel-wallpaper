# PixelWallpaper AI 启动脚本
# 通过 PowerShell 启动开发服务器

$ErrorActionPreference = "Stop"

# 获取脚本所在目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# 检查 Node.js 是否安装
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found" -ForegroundColor Red
    Write-Host "  Download: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# 检查 npm
$npmVersion = npm --version
Write-Host "[OK] npm: $npmVersion" -ForegroundColor Green

# 检查 node_modules 是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] npm install failed" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# 启动应用
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  PixelWallpaper AI Starting..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

npm run electron:dev

# 如果应用退出，暂停显示
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "App exited with code: $LASTEXITCODE" -ForegroundColor Red
    Read-Host "Press Enter to close"
}
