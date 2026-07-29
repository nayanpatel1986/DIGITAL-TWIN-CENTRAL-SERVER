@echo off
setlocal EnableDelayedExpansion
set "PKG=%~dp0"
set "CENTRAL=%PKG%central"

echo.
echo === AHWR Central Database Reset and Start ===
echo WARNING: This deletes the local central database volume on this PC.
echo Use this only when crmf_timescaledb is unhealthy during offline install.
echo.
choice /C YN /M "Delete old database volume and recreate it"
if errorlevel 2 exit /b 0

where docker >nul 2>nul
if errorlevel 1 (
  echo ERROR: Docker Desktop is not installed or not running.
  pause
  exit /b 1
)

cd /d "%CENTRAL%"
echo Stopping containers...
docker compose down

echo Removing old database volume if present...
docker volume rm central_crmf_pgdata 2>nul

echo Starting fresh database...
docker compose up -d timescaledb
if errorlevel 1 goto failed

echo Waiting for database to become healthy...
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
  echo ERROR: Database still unhealthy. Logs:
  docker compose logs --tail=120 timescaledb
  goto failed
)

echo Starting backend and frontend...
docker compose up -d crmf-backend crmf-frontend
if errorlevel 1 goto failed

echo.
echo DONE. Open: http://localhost:8090
pause
exit /b 0

:failed
echo ERROR: Reset/start failed.
pause
exit /b 1
