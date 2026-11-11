@echo off
title AeroSort Backend (Port 8000)
echo ================================================================
echo Starting AeroSort AI Python FastAPI Backend on Port 8000...
echo Swagger API Docs: http://localhost:8000/docs
echo ================================================================
python -m uvicorn backend.app.main:app --port 8000 --reload
pause

