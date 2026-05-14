@echo off
chcp 65001 >nul
title PixelWallpaper AI 启动器
echo.
echo =====================================
echo   PixelWallpaper AI 启动器
echo =====================================
echo.

:: 检查 PowerShell 是否可用
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 PowerShell
    pause
    exit /b 1
)

:: 获取当前目录
cd /d "%~dp0"

:: 执行 PowerShell 脚本
echo 正在启动应用...
echo.
powershell -ExecutionPolicy Bypass -File "start.ps1"

:: 如果 PowerShell 脚本返回错误，暂停显示
if %errorlevel% neq 0 (
    echo.
    echo [错误] 启动失败，错误码: %errorlevel%
    pause
)
