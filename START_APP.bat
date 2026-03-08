@echo off
echo.
echo ============================================================
echo   Starting Adaptive AI Skill Mentor
echo ============================================================
echo.

echo Checking configuration...
if not exist "backend\.env" (
    echo [ERROR] backend\.env not found!
    echo Please run: setup-production.bat
    pause
    exit /b 1
)

echo [OK] Configuration found
echo.

echo Starting backend server...
echo.
echo ============================================================
echo   Backend Server
echo ============================================================
echo.
echo The backend will start on: http://localhost:3000
echo.
echo AI Mode: Hugging Face (FREE)
echo - Without API key: Uses smart fallbacks
echo - With API key: AI-powered responses
echo.
echo To get FREE Hugging Face API key (30 seconds):
echo   1. Visit: https://huggingface.co/join
echo   2. Create account
echo   3. Get token: https://huggingface.co/settings/tokens
echo   4. Add to backend\.env: HUGGINGFACE_API_KEY=hf_...
echo.
echo ============================================================
echo.

cd backend
npm run dev
