@echo off
echo ======================================
echo  POS System Setup (SQLite)
echo ======================================

echo.
echo [1/4] Installing Server Dependencies...
cd server
call npm install
echo.

echo [2/4] Generating Prisma Client...
call npx prisma generate
echo.

echo [3/4] Setting up Database...
call npx prisma db push
call node prisma\seed.js
echo.

echo [4/4] Installing Client Dependencies...
cd ..\client
call npm install
echo.

echo ======================================
echo Setup Complete!
echo.
echo To run the application:
echo.
echo 1. Start the server:
echo    cd server
echo    npm run dev
echo.
echo 2. In another terminal, start the client:
echo    cd client
echo    npm run dev
echo.
echo 3. Open http://localhost:5173 in your browser
echo.
echo ======================================
pause
