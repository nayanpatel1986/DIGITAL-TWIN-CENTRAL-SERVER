@echo off
setlocal

set "ROOT=%~dp0"
set "CENTRAL=%ROOT%central"
set "PACKAGE=%ROOT%AHWR_CENTRAL_OFFLINE_PACKAGE"
set "IMAGES=%PACKAGE%\docker-images"

echo.
echo === AHWR Central Offline Package Export ===
echo Source: %CENTRAL%
echo Package: %PACKAGE%
echo.

where docker >nul 2>nul
if errorlevel 1 (
  echo ERROR: Docker is not installed or not available in PATH.
  pause
  exit /b 1
)

if not exist "%CENTRAL%\docker-compose.yml" (
  echo ERROR: Cannot find "%CENTRAL%\docker-compose.yml".
  pause
  exit /b 1
)

echo Building latest backend and frontend images...
cd /d "%CENTRAL%"
docker compose build crmf-backend crmf-frontend
if errorlevel 1 (
  echo ERROR: Docker compose build failed.
  pause
  exit /b 1
)

echo.
echo Creating clean package folder...
if exist "%PACKAGE%" rmdir /s /q "%PACKAGE%"
mkdir "%IMAGES%"

echo Copying current project files...
robocopy "%CENTRAL%" "%PACKAGE%\central" /E /XD node_modules dist build .git /XF *.log
if %ERRORLEVEL% GEQ 8 (
  echo ERROR: File copy failed.
  pause
  exit /b 1
)

echo.
echo Saving Docker images. This can take a few minutes...
docker save -o "%IMAGES%\crmf-backend.tar" central-crmf-backend:latest
if errorlevel 1 (
  echo ERROR: Could not save backend image.
  pause
  exit /b 1
)

docker save -o "%IMAGES%\crmf-frontend.tar" central-crmf-frontend:latest
if errorlevel 1 (
  echo ERROR: Could not save frontend image.
  pause
  exit /b 1
)

docker image inspect timescale/timescaledb:latest-pg15 >nul 2>nul
if errorlevel 1 (
  echo Pulling TimescaleDB image because it is not present locally...
  docker pull timescale/timescaledb:latest-pg15
  if errorlevel 1 (
    echo ERROR: Could not pull TimescaleDB image. Connect internet and run again.
    pause
    exit /b 1
  )
)

docker save -o "%IMAGES%\timescaledb-latest-pg15.tar" timescale/timescaledb:latest-pg15
if errorlevel 1 (
  echo ERROR: Could not save TimescaleDB image.
  pause
  exit /b 1
)

echo Adding offline install scripts...
copy /Y "%ROOT%OFFLINE_INSTALL_ON_PC_TEMPLATE.bat" "%PACKAGE%\INSTALL_ON_OFFLINE_PC.bat" >nul
copy /Y "%ROOT%OFFLINE_RESET_DATABASE_TEMPLATE.bat" "%PACKAGE%\RESET_DATABASE_AND_START.bat" >nul
copy /Y "%ROOT%OFFLINE_SET_ADMIN_PASSWORD_TEMPLATE.bat" "%PACKAGE%\SET_ADMIN_PASSWORD_Admin123.bat" >nul
copy /Y "%ROOT%OFFLINE_DIAGNOSE_DB_TEMPLATE.bat" "%PACKAGE%\DIAGNOSE_OFFLINE_DB.bat" >nul

echo.
echo SUCCESS.
echo Copy this folder to pendrive:
echo %PACKAGE%
echo.
echo On the offline PC, open that folder and double-click:
echo INSTALL_ON_OFFLINE_PC.bat
echo.
echo If database is unhealthy on offline PC, double-click:
echo RESET_DATABASE_AND_START.bat
echo.
pause

