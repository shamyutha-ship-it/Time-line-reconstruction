@echo off
echo ========================================================
echo Starting Digital Evidence Timeline Analyzer...
echo ========================================================
start http://localhost:8000
python -m http.server 8000
