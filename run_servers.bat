@echo off
SETLOCAL EnableDelayedExpansion

:: Set colors for the main window
color 0B

echo ===================================================
echo   🚚 FOODBRIDGE - NGO & DONOR MANAGEMENT SYSTEM
echo ===================================================
echo.
echo [1/2] Launching Backend Server...
start "FoodBridge - Backend Server" cmd /k "cd server && echo Starting Express Server... && node server.js"

echo [2/2] Launching Frontend Client...
start "FoodBridge - Frontend Client" cmd /k "cd client && echo Starting Vite Dev Server... && npm run dev"

echo.
echo ===================================================
echo   ✅ Both servers are now starting!
echo   - Backend: http://localhost:5000/api
echo   - Frontend: http://localhost:5173
echo.
echo   Keep this window open or close it as you wish.
echo ===================================================
pause
