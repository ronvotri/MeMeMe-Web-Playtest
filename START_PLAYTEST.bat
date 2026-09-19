@echo off
setlocal
cd /d "%~dp0"
title MeMeMe Standard Gameplay Playtest
echo.
echo ========================================
echo   MeMeMe STANDARD GAMEPLAY PLAYTEST
echo ========================================
echo.
echo Day la gameplay chuan / integration target cua MeMeMe.
echo Draft D preview va Full Map la cong cu QA rieng, khong thay the file nay.
echo KHONG mo index.html truc tiep bang file:// nhe.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-playtest.ps1"
if errorlevel 1 (
  echo.
  echo Khong khoi dong duoc playtest server.
  echo Vui long chup man hinh cua so nay va gui lai de debug.
  pause
)
endlocal
