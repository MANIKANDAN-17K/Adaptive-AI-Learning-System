@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   Production Readiness Verification
echo   Adaptive AI Skill Mentor
echo ============================================================
echo.

set PASS=0
set FAIL=0

echo Checking environment configuration...
echo ----------------------------------------

REM Check backend .env
if exist "backend\.env" (
    echo [PASS] backend\.env exists
    set /a PASS+=1
) else (
    echo [FAIL] backend\.env missing
    set /a FAIL+=1
)

REM Check frontend .env
if exist "frontend\.env" (
    echo [PASS] frontend\.env exists
    set /a PASS+=1
) else (
    echo [FAIL] frontend\.env missing
    set /a FAIL+=1
)

echo.
echo Checking dependencies...
echo ----------------------------------------

REM Check backend node_modules
if exist "backend\node_modules" (
    echo [PASS] Backend dependencies installed
    set /a PASS+=1
) else (
    echo [FAIL] Backend dependencies not installed
    echo        Run: cd backend ^&^& npm install
    set /a FAIL+=1
)

REM Check frontend node_modules
if exist "frontend\node_modules" (
    echo [PASS] Frontend dependencies installed
    set /a PASS+=1
) else (
    echo [FAIL] Frontend dependencies not installed
    echo        Run: cd frontend ^&^& npm install
    set /a FAIL+=1
)

echo.
echo Checking migration files...
echo ----------------------------------------

if exist "backend\src\migrations\000_COMPLETE_MIGRATION.sql" (
    echo [PASS] Complete migration script exists
    set /a PASS+=1
) else (
    echo [FAIL] Migration script missing
    set /a FAIL+=1
)

echo.
echo Checking source files...
echo ----------------------------------------

if exist "backend\src\index.ts" (
    echo [PASS] Backend entry point exists
    set /a PASS+=1
) else (
    echo [FAIL] Backend entry point missing
    set /a FAIL+=1
)

if exist "frontend\src\App.tsx" (
    echo [PASS] Frontend entry point exists
    set /a PASS+=1
) else (
    echo [FAIL] Frontend entry point missing
    set /a FAIL+=1
)

if exist "backend\src\engine\AdaptiveLearningEngine.ts" (
    echo [PASS] Adaptive Learning Engine exists
    set /a PASS+=1
) else (
    echo [FAIL] Adaptive Learning Engine missing
    set /a FAIL+=1
)

if exist "backend\src\services\AIServiceOrchestrator.ts" (
    echo [PASS] AI Service Orchestrator exists
    set /a PASS+=1
) else (
    echo [FAIL] AI Service Orchestrator missing
    set /a FAIL+=1
)

if exist "frontend\src\components\LearningSession.tsx" (
    echo [PASS] Learning Session component exists
    set /a PASS+=1
) else (
    echo [FAIL] Learning Session component missing
    set /a FAIL+=1
)

if exist "frontend\src\contexts\AuthContext.tsx" (
    echo [PASS] Auth Context exists
    set /a PASS+=1
) else (
    echo [FAIL] Auth Context missing
    set /a FAIL+=1
)

echo.
echo Checking documentation...
echo ----------------------------------------

if exist "QUICK_START.md" (
    echo [PASS] Quick Start guide exists
    set /a PASS+=1
) else (
    echo [FAIL] Quick Start guide missing
    set /a FAIL+=1
)

if exist "PRODUCTION_SETUP.md" (
    echo [PASS] Production Setup guide exists
    set /a PASS+=1
) else (
    echo [FAIL] Production Setup guide missing
    set /a FAIL+=1
)

if exist "PRODUCTION_READY_SUMMARY.md" (
    echo [PASS] Production Ready Summary exists
    set /a PASS+=1
) else (
    echo [FAIL] Production Ready Summary missing
    set /a FAIL+=1
)

echo.
echo ============================================================
echo   Verification Results
echo ============================================================
echo.
echo Passed: !PASS!
echo Failed: !FAIL!
echo.

if !FAIL! EQU 0 (
    echo [SUCCESS] All checks passed! ✓
    echo.
    echo Your application is production-ready!
    echo.
    echo Next steps:
    echo 1. Apply database migrations ^(see QUICK_START.md^)
    echo 2. Start backend: cd backend ^&^& npm run dev
    echo 3. Start frontend: cd frontend ^&^& npm run dev
    echo 4. Open http://localhost:5173
    echo.
) else (
    echo [WARNING] Some checks failed
    echo.
    echo Please fix the failed items above before proceeding.
    echo Run: setup-production.bat to fix common issues
    echo.
)

echo ============================================================
echo.
pause
