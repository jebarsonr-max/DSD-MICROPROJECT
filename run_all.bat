@echo off
title AeroSort AI - Full Stack Launcher
echo ================================================================
echo        AeroSort AI - Smart Airport Luggage Sorting System
echo ================================================================
echo.
echo [1/2] Launching Python FastAPI Backend on http://localhost:8000 ...
start cmd /k "title AeroSort Backend (Port 8000) && python -m uvicorn backend.app.main:app --port 8000 --reload"
timeout /t 3 /nobreak >nul

echo [2/2] Launching React Vite Frontend on http://localhost:5173 ...
start cmd /k "title AeroSort Frontend (Port 5173) && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ================================================================
echo Both servers are running!
echo - Frontend:  http://localhost:5173
echo - Backend:   http://localhost:8000/api
echo - API Docs:  http://localhost:8000/docs
echo ================================================================
