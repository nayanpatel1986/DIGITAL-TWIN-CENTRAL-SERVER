@echo off
setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
set "CENTRAL=%ROOT%central"
set "PACKAGE=%ROOT%AHWR_CENTRAL_OFFLINE_PACKAGE"
set "IMAGES=%PACKAGE%\docker-images"
set "TIMESCALE_IMAGE=timescale/timescaledb:latest-pg15"

echo.
echo ================================================================
echo  AHWR Central - One Click Offline Transfer Package
echo ================================================================
echo.
echo This will package:
echo   - Current central source code
echo   - Current central\.env settings
echo   - Docker images for offline install
echo   - One-click install/start scripts for the offline PC
echo.

where docker >nul 2>nul
if errorlevel 1 (
  echo ERROR: Docker Desktop is not installed, not running, or not in PATH.
  pause
  exit /b 1
)

if not exist "%CENTRAL%\docker-compose.yml" (
  echo ERROR: Cannot find "%CENTRAL%\docker-compose.yml".
  pause
  exit /b 1
)

if not exist "%CENTRAL%\.env" (
  echo ERROR: Cannot find "%CENTRAL%\.env".
  echo Create it first, then run this BAT again.
  pause
  exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in ("%CENTRAL%\.env") do (
  if /I "%%A"=="TIMESCALE_IMAGE" if not "%%B"=="" set "TIMESCALE_IMAGE=%%B"
)

echo Source folder:
echo   %CENTRAL%
echo.
echo Local package folder:
echo   %PACKAGE%
echo.
echo TimescaleDB image:
echo   %TIMESCALE_IMAGE%
echo.

cd /d "%CENTRAL%"

echo Building latest Docker images...
docker compose build crmf-backend crmf-frontend
if errorlevel 1 goto failed

echo.
echo Recreating package folder...
if exist "%PACKAGE%" rmdir /s /q "%PACKAGE%"
mkdir "%IMAGES%"
if errorlevel 1 goto failed

echo.
echo Copying current code and settings...
robocopy "%CENTRAL%" "%PACKAGE%\central" /E /XD node_modules dist build .git /XF *.log
if %ERRORLEVEL% GEQ 8 goto failed

echo.
echo Saving application Docker images...
docker save -o "%IMAGES%\crmf-backend.tar" central-crmf-backend:latest
if errorlevel 1 goto failed

docker save -o "%IMAGES%\crmf-frontend.tar" central-crmf-frontend:latest
if errorlevel 1 goto failed

docker image inspect "%TIMESCALE_IMAGE%" >nul 2>nul
if errorlevel 1 (
  echo.
  echo Pulling TimescaleDB image because it is not present locally...
  docker pull "%TIMESCALE_IMAGE%"
  if errorlevel 1 goto failed
)

docker save -o "%IMAGES%\timescaledb.tar" "%TIMESCALE_IMAGE%"
if errorlevel 1 goto failed

echo.
echo Adding offline helper scripts...
copy /Y "%ROOT%OFFLINE_INSTALL_ON_PC_TEMPLATE.bat" "%PACKAGE%\INSTALL_ON_OFFLINE_PC.bat" >nul
copy /Y "%ROOT%OFFLINE_RESET_DATABASE_TEMPLATE.bat" "%PACKAGE%\RESET_DATABASE_AND_START.bat" >nul
copy /Y "%ROOT%OFFLINE_SET_ADMIN_PASSWORD_TEMPLATE.bat" "%PACKAGE%\SET_ADMIN_PASSWORD_Admin123.bat" >nul
copy /Y "%ROOT%OFFLINE_DIAGNOSE_DB_TEMPLATE.bat" "%PACKAGE%\DIAGNOSE_OFFLINE_DB.bat" >nul
copy /Y "%ROOT%OFFLINE_DIAGNOSE_APP_TEMPLATE.bat" "%PACKAGE%\DIAGNOSE_OFFLINE_APP.bat" >nul
copy /Y "%ROOT%OFFLINE_DIAGNOSE_WELL_SYNC_TEMPLATE.bat" "%PACKAGE%\DIAGNOSE_WELL_SYNC.bat" >nul
copy /Y "%ROOT%OFFLINE_SET_ACTIVE_WELL_TEMPLATE.bat" "%PACKAGE%\SET_ACTIVE_WELL_MANUAL.bat" >nul
copy /Y "%ROOT%SET_CENTRAL_IP.bat" "%PACKAGE%\SET_CENTRAL_IP.bat" >nul

echo.
set "DEST="
set /p DEST=Enter USB drive/folder to copy package to, or press Enter to skip: 
if not "%DEST%"=="" (
  if not exist "%DEST%" (
    echo ERROR: Destination does not exist: %DEST%
    goto failed
  )
  set "DESTPKG=%DEST%\AHWR_CENTRAL_OFFLINE_PACKAGE"
  echo.
  echo Copying package to:
  echo   !DESTPKG!
  robocopy "%PACKAGE%" "!DESTPKG!" /MIR
  if !ERRORLEVEL! GEQ 8 goto failed
)

echo.
echo ================================================================
echo  SUCCESS
echo ================================================================
echo.
echo Package is ready here:
echo   %PACKAGE%
echo.
if not "%DEST%"=="" (
  echo Package was also copied here:
  echo   !DESTPKG!
  echo.
)
echo On the offline PC:
echo   1. Copy/open AHWR_CENTRAL_OFFLINE_PACKAGE
echo   2. Double-click INSTALL_ON_OFFLINE_PC.bat
echo   3. Open http://localhost:8090
echo.
pause
exit /b 0

:failed
echo.
echo ================================================================
echo  ERROR: Offline transfer package failed
echo ================================================================
echo.
echo Check the message above, make sure Docker Desktop is running,
echo then double-click this BAT again.
echo.
pause
exit /b 1
