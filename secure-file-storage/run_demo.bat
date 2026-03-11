@echo off
echo Starting Secure File Storage System...

REM Navigate to backend and start FastAPI
start cmd /k "cd backend && title FastAPI Backend && pip install -r requirements.txt && python -m uvicorn main:app --reload --port 8000"

REM Navigate to frontend and start Next.js
start cmd /k "cd frontend && title Next.js Frontend && npm install && npm run dev"

echo Both servers are starting!
echo FastAPI Backend will be available at: http://localhost:8000/docs
echo Next.js Frontend will be available at: http://localhost:3000
echo.
echo Demo Instructions:
echo 1. Open http://localhost:3000
echo 2. Click "Create Account" and make an admin account (Role: Admin)
echo 3. Login to your account
echo 4. Upload a file on the Dashboard
echo 5. View Activity Logs and Users in the Admin Panel
