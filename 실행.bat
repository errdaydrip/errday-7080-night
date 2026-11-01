@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js LTS를 먼저 설치하세요: https://nodejs.org & pause & exit /b)
if not exist node_modules call npm install
start "" http://localhost:8080
npm start
pause
