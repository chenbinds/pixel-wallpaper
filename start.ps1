# PixelWallpaper AI 启动脚本
# 通过 PowerShell 启动开发服务器

$ErrorActionPreference = "Stop"

# 获取脚本所在目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# 检查 Node.js 是否安装
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 未检测到 Node.js，请先安装 Node.js" -ForegroundColor Red
    Write-Host "  下载地址: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按 Enter 键退出"
    exit 1
}

# 检查 npm
$npmVersion = npm --version
Write-Host "✓ npm 版本: $npmVersion" -ForegroundColor Green

# 检查 node_modules 是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "首次运行，正在安装依赖..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ 依赖安装失败" -ForegroundColor Red
        Read-Host "按 Enter 键退出"
        exit 1
    }
}

# 启动应用
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  PixelWallpaper AI 启动中..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

npm run electron:dev

# 如果应用退出，暂停显示
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "应用异常退出，退出码: $LASTEXITCODE" -ForegroundColor Red
    Read-Host "按 Enter 键关闭"
}
