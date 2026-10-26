@echo off
echo ========================================================
echo Uploading CGPA Calculator to GitHub
echo Repository: https://github.com/radhapatil0107/CGPA-Calculator
echo ========================================================
echo.

where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed on your system!
    echo.
    echo Please install Git from: https://git-scm.com/download/win
    echo (Use default settings during installation)
    echo.
    echo Once installed, double-click this file again to upload.
    echo.
    pause
    exit /b
)

echo [1/5] Initializing Git repository...
git init

echo [2/5] Staging files...
git add .

echo [3/5] Creating commit...
git commit -m "Upload CGPA Calculator Project"

echo [4/5] Setting main branch...
git branch -M main

echo [5/5] Connecting to remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/radhapatil0107/CGPA-Calculator.git

echo.
echo [Pushing code to GitHub...]
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo [SUCCESS] Your project was successfully uploaded!
    echo Visit: https://github.com/radhapatil0107/CGPA-Calculator
    echo ========================================================
) else (
    echo.
    echo If a GitHub authentication pop-up appears, click "Sign in with your browser".
)
echo.
pause
