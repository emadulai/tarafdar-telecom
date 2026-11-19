@echo off
cd /d "%~dp0"
where py >nul 2>&1
if errorlevel 1 goto python
py -3 start.py
goto end
:python
python start.py
:end
if errorlevel 1 pause
