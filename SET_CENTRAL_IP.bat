@echo off
setlocal
set "ROOT=%~dp0"
set "CENTRAL=%ROOT%central"
if not exist "%CENTRAL%\.env" (
  echo ERROR: central\.env not found.
  pause
  exit /b 1
)
set /p NEWIP=Enter new CENTRAL SERVER IP: 
if "%NEWIP%"=="" (
  echo No IP entered.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p='%CENTRAL%\.env'; $ip='%NEWIP%'; $lines=[System.Collections.Generic.List[string]]::new(); foreach($l in [System.IO.File]::ReadAllLines($p)){ if($l -match '^CENTRAL_HOST='){ [void]$lines.Add('CENTRAL_HOST=' + $ip); $done=$true } else { [void]$lines.Add($l) } }; if(-not $done){ [void]$lines.Add('CENTRAL_HOST=' + $ip) }; $utf8=New-Object System.Text.UTF8Encoding($false); [System.IO.File]::WriteAllLines($p,$lines,$utf8)"
cd /d "%CENTRAL%"
docker compose up -d
echo.
echo DONE. New URLs:
echo Portal: http://%NEWIP%:8090
echo Edge HTTP sync URL: http://%NEWIP%:6000
echo Edge ETP URL: ws://%NEWIP%:6000/etp
echo Token: AHWR-ETP-2026
pause