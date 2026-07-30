@echo off
setlocal
set "PKG=%~dp0"
set "CENTRAL=%PKG%central"
set "OUT=%PKG%OFFLINE_APP_DIAG.txt"

echo AHWR Central Offline App Diagnostic > "%OUT%"
echo Date: %DATE% %TIME% >> "%OUT%"
echo Package: %PKG% >> "%OUT%"
echo. >> "%OUT%"

where docker >> "%OUT%" 2>>&1
echo. >> "%OUT%"
docker version >> "%OUT%" 2>>&1
echo. >> "%OUT%"

cd /d "%CENTRAL%"

echo ==== docker compose ps ==== >> "%OUT%"
docker compose ps >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== backend inspect health ==== >> "%OUT%"
docker inspect crmf_backend --format "Status={{.State.Status}} Health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} ExitCode={{.State.ExitCode}} Error={{.State.Error}}" >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== backend health log ==== >> "%OUT%"
docker inspect crmf_backend --format "{{range .State.Health.Log}}{{println .Start}}{{println .Output}}{{println}}{{end}}" >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== backend logs tail 250 ==== >> "%OUT%"
docker compose logs --tail=250 crmf-backend >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== frontend logs tail 120 ==== >> "%OUT%"
docker compose logs --tail=120 crmf-frontend >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== database logs tail 120 ==== >> "%OUT%"
docker compose logs --tail=120 timescaledb >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo Diagnostic written to:
echo %OUT%
echo.
echo Please send this OFFLINE_APP_DIAG.txt file or screenshot its bottom lines.
pause
