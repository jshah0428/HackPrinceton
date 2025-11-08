@echo off
cd /d "%~dp0"
set ANTHROPIC_API_KEY=sk-ant-api03-IczImBf8rH7z7hPMpfuCsp6hse8vmUSz5x3gsMSQneKZ7X4P
echo Starting DoctorVoice Backend...
echo API Key: %ANTHROPIC_API_KEY:~0,20%...
python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0

