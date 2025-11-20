@echo off
REM MovieReview Project Setup Script
REM This script helps you set up environment files

echo.
echo ================================================
echo   MovieReview - MongoDB Atlas Setup Helper
echo ================================================
echo.

REM Check if MongoDB Atlas connection string was provided
set /p mongoUri="Enter your MongoDB Atlas Connection String: "

if "%mongoUri%"=="" (
    echo Error: Connection string is required
    exit /b 1
)

REM Create .env files for each service
echo Creating .env files...

REM User Service
echo MONGO_URI=%mongoUri%/user-service?retryWrites=true^&w=majority > user-service\.env
echo PORT=4001 >> user-service\.env
echo ✓ Created user-service/.env

REM Auth Service
echo MONGO_URI=%mongoUri%/auth-service?retryWrites=true^&w=majority > auth-service\.env
echo PORT=4000 >> auth-service\.env
echo JWT_SECRET=your-secret-key-change-this >> auth-service\.env
echo ✓ Created auth-service/.env

REM Review Service
echo MONGO_URI=%mongoUri%/review-service?retryWrites=true^&w=majority > review-service\.env
echo PORT=4003 >> review-service\.env
echo ✓ Created review-service/.env

REM Content Service
echo MONGO_URI=%mongoUri%/content-service?retryWrites=true^&w=majority > content-service\.env
echo PORT=4004 >> content-service\.env
echo ✓ Created content-service/.env

REM Search Service
echo PORT=4005 > search-service\.env
echo ✓ Created search-service/.env

echo.
echo ================================================
echo   Setup Complete!
echo ================================================
echo.
echo Next steps:
echo 1. Review the .env files in each service
echo 2. Change JWT_SECRET in auth-service/.env
echo 3. Update MongoDB credentials if needed
echo 4. Run: npm install in each service
echo 5. Run: npm start in each service
echo.
echo For more info, see: MONGODB_ATLAS_SETUP.md
echo.

pause
