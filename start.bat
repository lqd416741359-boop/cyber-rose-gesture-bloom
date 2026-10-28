@echo off
cd /d "%~dp0"
echo.
echo   Fingertip Bloom - Starting...
echo   The server will start first, then Microsoft Edge will open.
echo   Press Ctrl+C to stop.
echo.
node server.mjs --open
pause
