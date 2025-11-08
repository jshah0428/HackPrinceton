@echo off
cd /d "%~dp0"
for /f "tokens=2 delims==" %%a in ('findstr "ANTHROPIC_API_KEY" .env') do set ANTHROPIC_API_KEY=%%a
echo Starting DoctorVoice Backend...
echo API Key loaded: %ANTHROPIC_API_KEY:~0,10%...
python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
pause

