@echo off
REM Kill any existing Node processes
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak

REM Start Search Service on port 6005
start "Search Service (6005)" cmd /k "cd search-service && npm start"
timeout /t 3 /nobreak

REM Start User Service on port 6001
start "User Service (6001)" cmd /k "cd user-service && npm start"
timeout /t 3 /nobreak

REM Start Auth Service on port 6002
start "Auth Service (6002)" cmd /k "cd auth-service && npm start"
timeout /t 3 /nobreak

REM Start Content Service on port 6003
start "Content Service (6003)" cmd /k "cd content-service && npm start"
timeout /t 3 /nobreak

REM Start Recommendation Service on port 6004
start "Recommendation Service (6004)" cmd /k "cd recommendation-service && npm start"
timeout /t 3 /nobreak

REM Start Review Service on port 6006
start "Review Service (6006)" cmd /k "cd review-service && npm start"
timeout /t 3 /nobreak

REM Start Notification Service on port 6007
start "Notification Service (6007)" cmd /k "cd notification-service && npm start"
timeout /t 3 /nobreak

REM Start Admin Service on port 6008
start "Admin Service (6008)" cmd /k "cd admin-service && npm start"
timeout /t 3 /nobreak

REM Start API Gateway on port 3002
start "API Gateway (3002)" cmd /k "cd api-gateway && npm start"
timeout /t 3 /nobreak

REM Start Frontend on port 3000
start "Frontend (3000)" cmd /k "cd frontend && npm start"

echo.
echo All services started! Opening frontend at http://localhost:3000
timeout /t 5
start http://localhost:3000
