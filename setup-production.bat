@echo off
echo ============================================================
echo   Adaptive AI Skill Mentor - Production Setup
echo ============================================================
echo.

echo Step 1: Checking environment files...
if not exist "backend\.env" (
    echo [ERROR] backend\.env not found
    echo Creating from backend\.env.example...
    copy backend\.env.example backend\.env
    echo [OK] Created backend\.env
) else (
    echo [OK] backend\.env exists
)

if not exist "frontend\.env" (
    echo [ERROR] frontend\.env not found
    echo Creating frontend\.env...
    echo VITE_API_URL=http://localhost:3000/api > frontend\.env
    echo [OK] Created frontend\.env
) else (
    echo [OK] frontend\.env exists
)

echo.
echo Step 2: Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
cd ..

echo.
echo Step 3: Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
cd ..

echo.
echo ============================================================
echo   Setup Complete!
echo ============================================================
echo.
echo IMPORTANT: Apply Database Migrations
echo ----------------------------------------
echo 1. Open your Supabase Dashboard
echo 2. Go to SQL Editor
echo 3. Copy contents of: backend\src\migrations\000_COMPLETE_MIGRATION.sql
echo 4. Paste and click "Run"
echo.
echo After migrations are applied:
echo ----------------------------------------
echo Terminal 1 - Backend:
echo   cd backend
echo   npm run dev
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo Then open: http://localhost:5173
echo.
echo ============================================================
pause
