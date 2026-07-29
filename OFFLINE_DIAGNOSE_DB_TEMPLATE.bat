@echo off
setlocal
set "PKG=%~dp0"
set "CENTRAL=%PKG%central"
set "OUT=%PKG%OFFLINE_DB_DIAG.txt"

echo AHWR Central Offline DB Diagnostic > "%OUT%"
echo Date: %DATE% %TIME% >> "%OUT%"
echo Package: %PKG% >> "%OUT%"
echo. >> "%OUT%"

where docker >> "%OUT%" 2>>&1
echo. >> "%OUT%"
docker version >> "%OUT%" 2>>&1
echo. >> "%OUT%"
docker info >> "%OUT%" 2>>&1
echo. >> "%OUT%"

cd /d "%CENTRAL%"
echo ==== docker compose ps ==== >> "%OUT%"
docker compose ps >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== crmf_timescaledb inspect health ==== >> "%OUT%"
docker inspect crmf_timescaledb --format "Status={{.State.Status}} Health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} ExitCode={{.State.ExitCode}} Error={{.State.Error}}" >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== crmf_timescaledb health log ==== >> "%OUT%"
docker inspect crmf_timescaledb --format "{{range .State.Health.Log}}{{println .Start}}{{println .Output}}{{println}}{{end}}" >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== timescaledb logs tail 200 ==== >> "%OUT%"
docker compose logs --tail=200 timescaledb >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== volumes ==== >> "%OUT%"
docker volume ls >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo Diagnostic written to:
echo %OUT%
echo.
echo Please send this OFFLINE_DB_DIAG.txt file or screenshot its bottom lines.
pause
