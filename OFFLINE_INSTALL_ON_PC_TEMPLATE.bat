@echo off
setlocal EnableDelayedExpansion
set "PKG=%~dp0"
set "CENTRAL=%PKG%central"
set "IMAGES=%PKG%docker-images"
echo.
echo === AHWR Central Offline Install / Start ===
where docker >nul 2>nul
if errorlevel 1 (
  echo ERROR: Docker Desktop is not installed or not running.
  pause
  exit /b 1
)
echo Loading Docker images...
docker load -i "%IMAGES%\timescaledb-latest-pg15.tar"
if errorlevel 1 goto failed
docker load -i "%IMAGES%\crmf-backend.tar"
if errorlevel 1 goto failed
docker load -i "%IMAGES%\crmf-frontend.tar"
if errorlevel 1 goto failed

echo Starting database first...
cd /d "%CENTRAL%"
docker compose up -d timescaledb
if errorlevel 1 goto failed

echo Waiting for database to become healthy. First start can take 3-5 minutes...
set "DB_OK="
for /L %%i in (1,1,60) do (
  set "DB_HEALTH="
  for /f "tokens=*" %%s in ('docker inspect -f "{{.State.Health.Status}}" crmf_timescaledb 2^>nul') do set "DB_HEALTH=%%s"
  if /I "!DB_HEALTH!"=="healthy" (
    set "DB_OK=1"
    goto db_ready
  )
  timeout /t 5 /nobreak >nul
)

:db_ready
if not defined DB_OK (
  echo.
  echo ERROR: Database did not become healthy.
  echo Showing last database logs:
  docker compose logs --tail=80 timescaledb
  echo.
  echo If this PC has an old or broken database volume, run:
  echo RESET_DATABASE_AND_START.bat
  goto failed
)

echo Starting backend and frontend...
docker compose up -d crmf-backend crmf-frontend
if errorlevel 1 goto failed

echo.
echo DONE.
echo Open this PC: http://localhost:8090
echo From another PC on LAN use: http://THIS_PC_IP:8090
echo Edge sync central URL: http://THIS_PC_IP:6000
echo Device token: change-me-rig-ingest-token
pause
exit /b 0

:failed
echo ERROR: Offline install/start failed.
pause
exit /b 1
