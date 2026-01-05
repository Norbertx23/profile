@echo off
setlocal
cd /d "%~dp0"

set APP_FILE=app.py
set PORT=5001

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [BLAD] Python nie jest zainstalowany lub brak go w PATH.
    pause
    exit /b
)

if exist ".venv" goto VENV_ISTNIEJE

:TWORZENIE_VENV
echo [INFO] Tworzenie srodowiska .venv...
python -m venv .venv
echo [INFO] Instalacja Flask...
".venv\Scripts\python.exe" -m pip install Flask
goto PRZYGOTOWANIE_STARTU

:VENV_ISTNIEJE
goto PRZYGOTOWANIE_STARTU

:PRZYGOTOWANIE_STARTU
(
echo $ErrorActionPreference = "Stop"
echo $port = %PORT%
echo try {
echo     $con = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
echo     if ^(!$con^) { exit 0 }
echo     $proc = Get-Process -Id $con.OwningProcess
echo     if ^($proc.ProcessName -match 'python'^) { 
echo         Stop-Process -Id $proc.Id -Force
echo         exit 0 
echo     }
echo     Write-Host "BLOCKER"
echo     exit 1
echo } catch { exit 0 }
) > check_port.ps1

powershell -NoProfile -ExecutionPolicy Bypass -File check_port.ps1
set PS_EXIT_CODE=%errorlevel%

del check_port.ps1

if %PS_EXIT_CODE% neq 0 (
    echo.
    echo ===============================================================
    echo  [BLAD] Port %PORT% jest zajety przez inna aplikacje!
    echo  Skrypt nie zamknie jej automatycznie dla bezpieczenstwa.
    echo ===============================================================
    pause
    exit /b
)

start "" /B ".venv\Scripts\pythonw.exe" %APP_FILE%

cls
echo ========================================================
echo   Adres: http://localhost:%PORT%
echo.
echo   Nacisnij ENTER, aby ZAMKNAC aplikacje i wyjsc.
echo ========================================================

pause >nul

echo [STOP] Zamykanie procesu...
powershell -Command "Get-NetTCPConnection -LocalPort %PORT% -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"

echo Gotowe.