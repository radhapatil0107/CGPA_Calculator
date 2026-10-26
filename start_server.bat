@echo off
title Student Grade Calculator - DYPCET Kolhapur
echo ========================================================
echo   Student Grade Calculator - DYPCET CSE (Data Science)
echo ========================================================
echo.
echo Starting web server...
cd /d "%~dp0cgpa-calculator\backend"

:: Wait 1 second then open default web browser automatically
start "" cmd /c "timeout /t 2 >nul & start http://127.0.0.1:5000"

:: Start the Flask application
python app.py

pause
