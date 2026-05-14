@echo off
chcp 65001 >nul
title PixelWallpaper AI
echo.
echo =====================================
echo   PixelWallpaper AI
echo =====================================
echo.

cd /d "%~dp0"

echo Starting...
echo.
powershell -ExecutionPolicy Bypass -File "start.ps1"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed, code: %errorlevel%
    pause
)
