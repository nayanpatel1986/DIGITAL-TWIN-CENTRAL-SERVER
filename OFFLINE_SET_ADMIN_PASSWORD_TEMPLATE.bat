@echo off
setlocal
set "PKG=%~dp0"
set "CENTRAL=%PKG%central"

echo.
echo === AHWR Central Admin Password Repair ===
echo This sets portal login to:
echo Username: admin
echo Password: Admin123
echo.

where docker >nul 2>nul
if errorlevel 1 (
  echo ERROR: Docker Desktop is not installed or not running.
  pause
  exit /b 1
)

cd /d "%CENTRAL%"

echo Restarting backend with updated ADMIN_PASSWORD...
docker compose up -d crmf-backend
if errorlevel 1 goto failed

echo Waiting 10 seconds...
timeout /t 10 /nobreak >nul

echo Updating admin password directly in database...
docker compose exec -T crmf-backend node -e "const {query}=require('./lib/db'); const {hash}=require('./lib/auth'); (async()=>{await query(\"INSERT INTO users (username,password,display,role,source,disabled) VALUES ($1,$2,$3,$4,$5,false) ON CONFLICT (username) DO UPDATE SET password=EXCLUDED.password, display=EXCLUDED.display, role=EXCLUDED.role, source=EXCLUDED.source, disabled=false\", ['admin', hash('Admin123'), 'Asset Administrator', 'admin', 'local']); console.log('admin password set to Admin123'); process.exit(0);})().catch(e=>{console.error(e); process.exit(1);});"
if errorlevel 1 goto failed

echo Restarting frontend/backend...
docker compose up -d crmf-backend crmf-frontend
if errorlevel 1 goto failed

echo.
echo DONE. Login now:
echo Username: admin
echo Password: Admin123
pause
exit /b 0

:failed
echo ERROR: Admin password repair failed.
pause
exit /b 1
