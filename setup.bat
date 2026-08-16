@echo off
echo ======================================
echo  POS System Setup (SQLite)
echo ======================================

echo.
echo [1/3] Installing Server Dependencies...
cd server
call npm install
call npx prisma generate
call npx prisma db push
call npm run db:seed
echo.

echo [2/3] Installing Client Dependencies...
cd ..\client
call npm install
echo.

echo [3/3] Done!
echo ======================================
echo.
echo Setup Complete!
echo.
echo To run the application:
echo.
echo 1. Start the server:
echo    cd server ^&^& npm run dev
echo.
echo 2. In another terminal, start the client:
echo    cd client ^&^& npm run dev
echo.
echo 3. Open http://localhost:5173 in your browser
echo.
echo ======================================
pause
